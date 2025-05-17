import { Component, effect, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import {
  distinctUntilChanged,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
} from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";
import { EventService } from "../../../../core/services/event.service";
import { EventNames, TeamData } from "../../../../core/models/event.model";
import { EventCardComponent } from "../event-card/event-card.component";
import { LoadingComponent } from "../../../../shared/components/loading/loading.component";

@Component({
  selector: "app-event-list",
  standalone: true,
  imports: [
    CommonModule,
    EventCardComponent,
    LoadingComponent,
    // ErrorComponent
  ],
  templateUrl: "./event-list.component.html",
  styleUrls: ["./event-list.component.css"],
})
export class EventListComponent {
  private eventService = inject(EventService);
  private router = inject(Router);
  activeTab = signal(0);
  eventNames = EventNames;

  readonly events$ = this.eventService.getInplayEvents();
  readonly selectedEventId = signal<number | null>(null);

  teamData$: Observable<TeamData[]> = toObservable(this.selectedEventId).pipe(
    switchMap((eventId) => {
      if (eventId === null) return of([]);
      return this.eventService.eventDetails().pipe(
        map((events) =>
          Array.from(events).filter((event) => event.id === eventId)
        ),
        distinctUntilChanged((prev, curr) => prev[0]?.id === curr[0]?.id),
        shareReplay(1)
      );
    })
  );

  readonly mapIdToEvent: { [id: number]: keyof typeof EventNames } = {
    1: "football",
    2: "tennis",
    3: "basketball",
    4: "baseball",
    5: "icehockey",
    6: "handball",
    7: "volleyball",
    8: "badminton",
    9: "beachvolleyball",
    10: "futsal",
  };
  constructor() {
    effect(() => {
      this.events$.subscribe((events) => {
        if (events.length > 0) {
          this.selectedEventId.set(events[0].id);
        }
      });
    });
  }

  setActiveTab(tabId: number, eventId: number): void {
    this.activeTab.set(tabId);
    this.selectedEventId.set(eventId);
  }

  navigateToEvent(eventId: number): void {
    this.router.navigate(["/event", eventId]);
  }
}
