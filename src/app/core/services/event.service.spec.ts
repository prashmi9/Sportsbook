import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, Subject } from "rxjs";
import { EventService } from "./event.service";
import { WebSocketService } from "./websocket.service";
import { EventId, TeamData } from "../models/event.model";
import { MarketData } from "../models/market.model";

describe("EventService", () => {
  let service: EventService;
  let websocketServiceMock: jasmine.SpyObj<WebSocketService>;

  let inplayEventsSubject: Subject<EventId[]>;
  let eventDataSubject: Subject<TeamData>;
  let marketDataSubject: Subject<MarketData>;

  const mockEventId1: EventId = { id: 1 };
  const mockEventId2: EventId = { id: 2 };

  const mockTeamData1: TeamData = {
    id: 1,
    homeTeam: "Everton",
    homeScore: 3,
    awayTeam: "Arsenal",
    awayScore: 4,
    marketId: 102,
  };

  const mockTeamData2: TeamData = {
    id: 2,
    homeTeam: "Aston Villa",
    homeScore: 2,
    awayTeam: "Leicester",
    awayScore: 0,
    marketId: 103,
  };

  const mockMarketData: MarketData = {
    id: 109,
    home: "4.00",
    away: "1.85",
    draw: "3.60",
  };

  beforeEach(() => {
    inplayEventsSubject = new Subject<EventId[]>();
    eventDataSubject = new Subject<TeamData>();
    marketDataSubject = new Subject<MarketData>();

    websocketServiceMock = jasmine.createSpyObj("WebSocketService", [
      "subscribe",
      "unsubscribe",
    ]);

    websocketServiceMock.subscribe.and.callFake((destination: string) => {
      if (destination === "/topic/inplay") {
        return inplayEventsSubject.asObservable();
      } else if (destination.startsWith("/topic/event/")) {
        return eventDataSubject.asObservable();
      } else if (destination.startsWith("/topic/market/")) {
        return marketDataSubject.asObservable();
      }
      return of(null);
    });

    TestBed.configureTestingModule({
      providers: [
        EventService,
        { provide: WebSocketService, useValue: websocketServiceMock },
        provideRouter([]),
      ],
    });

    service = TestBed.inject(EventService);
  });

  it("service should be created successfully", () => {
    expect(service).toBeTruthy();
  });

  it("should subscribe to inplay events on initialization", () => {
    expect(websocketServiceMock.subscribe).toHaveBeenCalledWith(
      "/topic/inplay"
    );
  });

  describe("handling in-play events", () => {
    it("should subscribe to new events", () => {
      inplayEventsSubject.next([mockEventId1]);

      expect(websocketServiceMock.subscribe).toHaveBeenCalledWith(
        "/topic/event/1"
      );

      let receivedEvents: TeamData[] = [];
      service.eventDetails().subscribe((events) => {
        receivedEvents = events;
      });

      eventDataSubject.next(mockTeamData1);

      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0]).toEqual(mockTeamData1);
    });

    it("should handle new and removed events correctly", () => {
      inplayEventsSubject.next([mockEventId1]);

      inplayEventsSubject.next([mockEventId1, mockEventId2]);

      expect(websocketServiceMock.subscribe).toHaveBeenCalledWith(
        "/topic/event/1"
      );
      expect(websocketServiceMock.subscribe).toHaveBeenCalledWith(
        "/topic/event/2"
      );

      inplayEventsSubject.next([mockEventId2]);

      expect(websocketServiceMock.unsubscribe).toHaveBeenCalledWith(
        "/topic/event/1"
      );
    });
  });

  describe("getEventById", () => {
    it("should return the specified event", () => {
      inplayEventsSubject.next([mockEventId1, mockEventId2]);
      eventDataSubject.next(mockTeamData1);
      eventDataSubject.next(mockTeamData2);

      let receivedEvent: TeamData | undefined;
      service.getEventById(1).subscribe((event) => {
        receivedEvent = event;
      });

      eventDataSubject.next({ ...mockTeamData1 });

      expect(receivedEvent).toBeDefined();
      expect(receivedEvent?.id).toBe(1);
    });

    it("should return undefined for non-existent event", () => {
      inplayEventsSubject.next([mockEventId1]);
      eventDataSubject.next(mockTeamData1);

      let receivedEvent: TeamData | undefined;
      service.getEventById(999).subscribe((event) => {
        receivedEvent = event;
      });

      eventDataSubject.next({ ...mockTeamData1 });

      expect(receivedEvent).toBeUndefined();
    });
  });

  describe("private methods", () => {
    it("should handle event unsubscription correctly", () => {
      inplayEventsSubject.next([mockEventId1]);

      inplayEventsSubject.next([]);

      expect(websocketServiceMock.unsubscribe).toHaveBeenCalledWith(
        "/topic/event/1"
      );
    });

    it("should handle market unsubscription correctly", () => {
      service.getAllMarkets(101, 1);
      marketDataSubject.next(mockMarketData);

      let receivedMarket: MarketData | undefined;
      service.getMarketById(101).subscribe((market) => {
        receivedMarket = market;
      });

      expect(receivedMarket).toBeDefined();

      inplayEventsSubject.next([]);
    });
  });
});
