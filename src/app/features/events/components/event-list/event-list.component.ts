import {
  AfterViewChecked,
  Component,
  inject,
  OnChanges,
  OnInit,
  signal,
} from "@angular/core";
import { ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { map, Observable, of } from "rxjs";
import { EventService } from "../../../../core/services/event.service";
import { EventNames, TeamData } from "../../../../core/models/event.model";
import { EventCardComponent } from "../event-card/event-card.component";
import { LoadingComponent } from "../../../../shared/components/loading/loading.component";
import { ErrorComponent } from "../../../../shared/components/error/error.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventListComponent implements OnInit, OnChanges, AfterViewChecked {
  private eventService = inject(EventService);
  private router = inject(Router);
  activeTab = signal(0);
  eventNames = EventNames;
  events$: Observable<TeamData[]> = of([]);
  teamData$: Observable<TeamData[]> = of([]);

  mapIdToEvent: { [id: number]: keyof typeof EventNames } = {
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

  ngOnInit(): void {
    this.events$ = this.eventService.getInplayEvents();
  }

  ngOnChanges(): void {
    this.setActiveTab(this.activeTab());
  }
  ngAfterViewChecked(): void {
    this.events$.subscribe((events) => {
      if (events.length > 0) {
        this.setActiveTab(this.activeTab());
      }
    });
  }
  setActiveTab(tabId: number): void {
    this.activeTab.set(tabId);
    this.teamData$ = this.eventService
      .eventDetails()
      .pipe(
        map((eventDetails) =>
          eventDetails.filter((event) => event.id === tabId)
        )
      );
  }

  navigateToEvent(eventId: number): void {
    this.router.navigate(["/event", eventId]);
  }
}
