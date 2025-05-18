import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EventListComponent } from "./event-list.component";
import { EventService } from "../../../../core/services/event.service";
import { Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { TeamData } from "../../../../core/models/event.model";
import { EventCardComponent } from "../event-card/event-card.component";
import { LoadingComponent } from "../../../../shared/components/loading/loading.component";

describe("EventListComponent", () => {
  let component: EventListComponent;
  let fixture: ComponentFixture<EventListComponent>;
  let eventService: jasmine.SpyObj<EventService>;
  let router: jasmine.SpyObj<Router>;

  const mockTeamData: TeamData[] = [
    {
      id: 1,
      homeTeam: "Everton",
      homeScore: 1,
      awayTeam: "Arsenal",
      awayScore: 2,
      marketId: 101,
    },
    {
      id: 2,
      homeTeam: "Aston Villa",
      homeScore: 3,
      awayTeam: "Leicester",
      awayScore: 4,
      marketId: 201,
    },
  ];

  const eventsSubject = new BehaviorSubject<TeamData[]>(mockTeamData);
  const eventDetailsSubject = new BehaviorSubject<TeamData[]>(mockTeamData);

  beforeEach(async () => {
    eventService = jasmine.createSpyObj("EventService", [
      "getInplayEvents",
      "eventDetails",
    ]);
    router = jasmine.createSpyObj("Router", ["navigate"]);

    eventService.getInplayEvents.and.returnValue(eventsSubject.asObservable());
    eventService.eventDetails.and.returnValue(
      eventDetailsSubject.asObservable()
    );

    await TestBed.configureTestingModule({
      imports: [EventListComponent, EventCardComponent, LoadingComponent],
      providers: [
        { provide: EventService, useValue: eventService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create the Event list component", () => {
    expect(component).toBeTruthy();
  });

  it("should set active tab and selected event ID", () => {
    const tabId = 1;
    const eventId = 2;

    component.setActiveTab(tabId, eventId);

    expect(component.activeTab()).toBe(tabId);
    expect(component.selectedEventId()).toBe(eventId);
  });

  it("should navigate to event details", () => {
    const eventId = 1;

    component.navigateToEvent(eventId);

    expect(router.navigate).toHaveBeenCalledWith(["/event", eventId]);
  });

  it("should map event IDs to correct sport names", () => {
    expect(component.mapIdToEvent[1]).toBe("football");
    expect(component.mapIdToEvent[2]).toBe("tennis");
    expect(component.mapIdToEvent[3]).toBe("basketball");
    expect(component.mapIdToEvent[4]).toBe("baseball");
    expect(component.mapIdToEvent[5]).toBe("icehockey");
    expect(component.mapIdToEvent[6]).toBe("handball");
    expect(component.mapIdToEvent[7]).toBe("volleyball");
    expect(component.mapIdToEvent[8]).toBe("badminton");
    expect(component.mapIdToEvent[9]).toBe("beachvolleyball");
    expect(component.mapIdToEvent[10]).toBe("futsal");
  });

  it("should automatically select first event when events are loaded", (done) => {
    setTimeout(() => {
      expect(component.setActiveTab(0, 1)).toBe();
      done();
    });
  });

  it("should handle empty events array", (done) => {
    eventsSubject.next([]);

    component.events$.subscribe((events) => {
      expect(events).toEqual([]);
      done();
    });
  });
});
