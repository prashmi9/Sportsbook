import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, Subscription, map, of, switchMap, tap } from "rxjs";
import { EventService } from "../../../../core/services/event.service";
import { TeamData } from "../../../../core/models/event.model";
import { MarketData } from "../../../../core/models/market.model";
import { MarketListComponent } from "../../../markets/components/market-list/market-list.component";
import { LoadingComponent } from "../../../../shared/components/loading/loading.component";
import { ErrorComponent } from "../../../../shared/components/error/error.component";

@Component({
  selector: "app-event-detail",
  standalone: true,
  imports: [
    CommonModule,
    LoadingComponent,
    ErrorComponent,
    MarketListComponent,
  ],
  templateUrl: "./event-detail.component.html",
  styleUrls: ["./event-detail.component.css"],
})
export class EventDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);

  eventId$: Observable<TeamData | undefined> = of(undefined);
  marketId: number = 0;
  marketData$: Observable<MarketData | undefined> | undefined;
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.eventId$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const eventId = params.get("id") || "";
        return this.eventService.getEventById(parseInt(eventId));
      }),
      tap((value) => {
        if (value) {
          this.eventService.getAllMarkets(value?.marketId, value?.id);
          this.marketData$ = this.eventService.getMarketById(value?.marketId);
        }
        if (!value) {
          console.log("Event not found");
        }
      })
    );
  }

  navigateBack(): void {
    this.router.navigate(["/"]);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
