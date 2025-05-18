import { Injectable, inject } from "@angular/core";
import { WebSocketService } from "./websocket.service";
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  map,
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

  private inplayEvents$ = new BehaviorSubject<EventId[]>([]);
  private eventsMap$ = new BehaviorSubject<Map<number, TeamData>>(new Map());
  private marketsMap$ = new BehaviorSubject<Map<number, MarketData>>(new Map());

  private activeEventSubscriptions = new Set<EventId>();
  private activeMarketSubscriptions = new Set<number>();

  constructor() {
    this.websocketService
      .subscribe("/topic/inplay")
      .pipe(
        tap((eventIds: EventId[]) => {
          const previousEvents = this.inplayEvents$.value;
          const newEvents = eventIds.filter(
            (id) => !previousEvents.includes(id)
          );
          console.log("new events received:", newEvents);
          const removedEvents = previousEvents.filter(
            (id) => !eventIds.includes(id)
          );

          newEvents.forEach((eventId) => this.subscribeToEvent(eventId));
          removedEvents.forEach((eventId) =>
            this.unsubscribeFromEvent(eventId)
          );

          this.inplayEvents$.next(eventIds);
        })
      )
      .subscribe();
  }

  private subscribeToEvent(eventId: EventId): void {
    if (!this.activeEventSubscriptions.has(eventId)) {
      const destination = `/topic/event/${eventId.id}`;
      this.websocketService
        .subscribe(destination)
        .pipe(
          tap((eventData: TeamData) => {
            const currentEvents = new Map(this.eventsMap$.value);
            // console.log("current event data:", currentEvents);
            currentEvents.set(eventId.id, eventData);
            this.eventsMap$.next(currentEvents);
          })
        )
        .subscribe();

      this.activeEventSubscriptions.add(eventId);
    }
  }

  private unsubscribeFromEvent(eventId: EventId): void {
    if (this.activeEventSubscriptions.has(eventId)) {
      this.websocketService.unsubscribe(`/topic/event/${eventId.id}`);
      this.activeEventSubscriptions.delete(eventId);

      const currentEvents = new Map(this.eventsMap$.value);
      const event = currentEvents.get(eventId.id);
      currentEvents.delete(eventId.id);
      this.eventsMap$.next(currentEvents);

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
            const enrichedMarketData = { ...marketData, eventId };
            const currentMarkets = new Map(this.marketsMap$.value);
            currentMarkets.set(marketId, enrichedMarketData);
            this.marketsMap$.next(currentMarkets);
          })
        )
        .subscribe();

      this.activeMarketSubscriptions.add(marketId);
    }
  }

  private unsubscribeFromMarket(marketId: number): void {
    if (this.activeMarketSubscriptions.has(marketId)) {
      this.websocketService.unsubscribe(`/topic/market/${marketId}`);
      this.activeMarketSubscriptions.delete(marketId);

      const currentMarkets = new Map(this.marketsMap$.value);
      currentMarkets.delete(marketId);
      this.marketsMap$.next(currentMarkets);
    }
  }

  // Public API

  public getInplayEvents(): Observable<TeamData[]> {
    return combineLatest([this.inplayEvents$, this.eventsMap$]).pipe(
      map(([eventIds, eventsMap]) =>
        eventIds
          .map((event) => eventsMap.get(event.id))
          .filter((event): event is TeamData => !!event)
      )
    );
  }

  public eventDetails(): Observable<TeamData[]> {
    return this.eventsMap$.pipe(
      map((eventsMap) => Array.from(eventsMap.values())),
      distinctUntilChanged(
        (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
      ),
      shareReplay(1)
    );
  }

  public getEventById(eventId: number): Observable<TeamData | undefined> {
    return this.eventsMap$.pipe(
      map((eventsMap) =>
        Array.from(eventsMap.values()).find((event) => event.id === eventId)
      ),
      distinctUntilChanged(
        (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
      )
    );
  }

  public getAllMarkets(marketId: number, eventId: number): void {
    this.subscribeToMarket(marketId, eventId);
  }

  public getMarketById(marketId: number): Observable<MarketData | undefined> {
    return this.marketsMap$.pipe(
      map((marketsMap) => marketsMap.get(marketId)),
      distinctUntilChanged(
        (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
      )
    );
  }
}
