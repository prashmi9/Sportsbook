import { Injectable, inject } from "@angular/core";
import { WebSocketService } from "./websocket.service";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  share,
  shareReplay,
  take,
  tap,
} from "rxjs";
import { EventId, TeamData } from "../models/event.model";
import { MarketData } from "../models/market.model";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class EventService {
  private websocketService = inject(WebSocketService);
  private router = inject(Router);

  private inplayEvents = new BehaviorSubject<EventId[]>([]);
  private eventsMap = new BehaviorSubject<Map<EventId, TeamData>>(new Map());
  private marketsMap = new BehaviorSubject<Map<number, MarketData>>(new Map());

  // Track subscriptions to clean up when events are removed from inplay
  private activeEventSubscriptions = new Set<EventId>();
  private activeMarketSubscriptions = new Set<number>();

  constructor() {
    // Initialize subscription to inplay events
    this.websocketService
      .subscribe("/topic/inplay")
      .pipe(
        tap((eventIds: EventId[]) => {
          const previousEvents = this.inplayEvents.value;

          // Handle new events - subscribe to events
          const newEvents = eventIds
            .map((id) => id)
            .filter((id) => !previousEvents.includes(id));

          newEvents?.forEach((eventId) => this.subscribeToEvent(eventId));

          // Handle removed events - unsubscribe from events
          const removedEvents: EventId | undefined = previousEvents.shift();

          if (removedEvents !== undefined) {
            this.unsubscribeFromEvent(removedEvents);
          }

          // Update the inplay events list
          // console.log("newEvents :", newEvents);
          this.inplayEvents.next(newEvents);
        })
      )
      .subscribe();
  }

  private subscribeToEvent(eventId: any): void {
    if (!this.activeEventSubscriptions.has(eventId)) {
      const destination = `/topic/event/${eventId.id}`;
      this.websocketService
        .subscribe(destination)
        .pipe(
          tap((eventData: TeamData) => {
            const currentEvents = this.eventsMap.value;
            currentEvents.set(eventId, eventData);
            this.eventsMap.next(new Map(currentEvents));
          })
        )
        .subscribe();

      this.activeEventSubscriptions.add(eventId);
    }
  }

  private unsubscribeFromEvent(eventId: EventId): void {
    if (this.activeEventSubscriptions.has(eventId)) {
      // Unsubscribe from the event
      this.websocketService.unsubscribe(`/topic/event/${eventId}`);
      this.activeEventSubscriptions.delete(eventId);

      const currentEvents = this.eventsMap.value;
      const event = currentEvents.get(eventId);
      // console.log("current  event:", currentEvents);
      currentEvents.delete(eventId);
      this.eventsMap.next(new Map(currentEvents));

      // Unsubscribe from associated markets
      if (event && event.markets) {
        event.markets.forEach((marketId: any) =>
          this.unsubscribeFromMarket(marketId)
        );
      }

      console.log(`Unsubscribed from event: ${eventId.id}`);
      //router to event details
      this.router.navigate(["/"]);
    }
  }

  private subscribeToMarket(marketId: number, eventId: number): void {
    if (!this.activeMarketSubscriptions.has(marketId)) {
      const destination = `/topic/market/${marketId}`;

      this.websocketService
        .subscribe(destination)
        .pipe(
          take(1),
          tap((marketData: MarketData) => {
            console.log("Received market data:", marketData);

            const enrichedMarketData = {
              ...marketData,
              eventId,
            };

            // Update markets map with new data
            const currentMarkets = this.marketsMap.value;
            currentMarkets.set(marketId, enrichedMarketData);
            this.marketsMap.next(new Map(currentMarkets));
          })
        )
        .subscribe();

      this.activeMarketSubscriptions.add(marketId);
      console.log(`Subscribed to market: ${marketId} for event: ${eventId}`);
    }
  }

  private unsubscribeFromMarket(marketId: number): void {
    if (this.activeMarketSubscriptions.has(marketId)) {
      this.websocketService.unsubscribe(`/topic/market/${marketId}`);
      this.activeMarketSubscriptions.delete(marketId);

      // Remove the market from the markets map
      const currentMarkets = this.marketsMap.value;
      currentMarkets.delete(marketId);
      this.marketsMap.next(new Map(currentMarkets));

      console.log(`Unsubscribed from market: ${marketId}`);
    }
  }

  // Public methods
  public getInplayEvents(): Observable<TeamData[]> {
    return combineLatest([this.inplayEvents, this.eventsMap]).pipe(
      map(([eventIds, eventsMap]) => {
        return eventIds
          .map((id) => {
            return eventsMap.get(id);
          })
          .filter((event): event is TeamData => !!event);
      }),
      share()
    );
  }
  public eventDetails() {
    return this.eventsMap.pipe(
      map((eventsMap) => {
        console.log("eventsMap:", eventsMap);
        return eventsMap.values();
      }),
      distinctUntilChanged(
        (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
      ),
      shareReplay(1)
    );
  }
  public getEventById(eventId: number): Observable<TeamData | undefined> {
    return this.eventsMap.pipe(
      map((eventsMap) => {
        const event = Array.from(eventsMap.values()).find(
          (event) => event.id === eventId
        );

        return event;
      }),
      distinctUntilChanged(
        (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
      )
    );
  }

  public getAllMarkets(marketId: number, eventId: number): void {
    this.subscribeToMarket(marketId, eventId);
  }

  public getMarketById(marketId: number): Observable<MarketData | undefined> {
    return this.marketsMap.pipe(
      map((marketsMap) =>
        Array.from(marketsMap.values()).find((market) => market.id === marketId)
      ),
      distinctUntilChanged(
        (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
      )
    );
  }
}
