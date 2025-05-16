import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { map, Observable, of } from "rxjs";
import { EventService } from "../../../../core/services/event.service";
import { TeamData } from "../../../../core/models/event.model";
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
})
export class EventListComponent implements OnInit {
  private eventService = inject(EventService);
  private router = inject(Router);
  activeTab = signal(0);

  events$: Observable<TeamData[]> = of([]);
  teamData$: Observable<TeamData[]> = of([]);

  ngOnInit(): void {
    this.events$ = this.eventService.getInplayEvents();
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
