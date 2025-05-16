import { Injectable, inject } from "@angular/core";
import { WebSocketService } from "./websocket.service";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
  share,
  take,
  tap,
} from "rxjs";
import { EventId, TeamData } from "../models/event.model";
import { MarketData } from "../models/market.model";

@Injectable({
  providedIn: "root",
})
export class EventService {
  private websocketService = inject(WebSocketService);

  private inplayEvents = new BehaviorSubject<number[]>([]);
  private eventsMap = new BehaviorSubject<Map<number, TeamData>>(new Map());
  private marketsMap = new BehaviorSubject<Map<number, MarketData>>(new Map());

  // Track subscriptions to clean up when events are removed from inplay
  private activeEventSubscriptions = new Set<number>();
  private activeMarketSubscriptions = new Set<number>();

  constructor() {
    // Initialize subscription to inplay events
    this.websocketService
      .subscribe("/topic/inplay")
      .pipe(
        tap((eventIds: number[]) => {
          const previousEvents = this.inplayEvents.value;
          console.log("Received inplay events:", eventIds);

          // Handle new events - subscribe to events that weren't in the previous list
          const newEvents = eventIds.filter(
            (id) => !previousEvents.includes(id)
          );
          newEvents.forEach((eventId) => this.subscribeToEvent(eventId));

          // Handle removed events - unsubscribe from events that are no longer in the list
          const removedEvents = previousEvents.filter(
            (id) => !eventIds.includes(id)
          );
          removedEvents.forEach((eventId) =>
            this.unsubscribeFromEvent(eventId)
          );

          // Update the inplay events list
          this.inplayEvents.next(eventIds);
        })
      )
      .subscribe();
  }

  private subscribeToEvent(eventId: any): void {
    console.log("Subscribing to event:", eventId);
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

  private unsubscribeFromEvent(eventId: number): void {
    if (this.activeEventSubscriptions.has(eventId)) {
      // Unsubscribe from the event
      this.websocketService.unsubscribe(`/topic/event/${eventId}`);
      this.activeEventSubscriptions.delete(eventId);

      // Remove the event from the events map
      const currentEvents = this.eventsMap.value;
      const event = currentEvents.get(eventId);
      currentEvents.delete(eventId);
      this.eventsMap.next(new Map(currentEvents));

      // Unsubscribe from associated markets
      if (event && event.markets) {
        event.markets.forEach((marketId: any) =>
          this.unsubscribeFromMarket(marketId)
        );
      }

      console.log(`Unsubscribed from event: ${eventId}`);
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
      map((eventsMap) => Array.from(eventsMap.values()))
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
