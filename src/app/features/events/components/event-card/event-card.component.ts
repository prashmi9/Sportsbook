import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TeamData } from "../../../../core/models/event.model";
import { Observable } from "rxjs";
import { MarketData } from "../../../../core/models/market.model";
import { EventService } from "../../../../core/services/event.service";
import { MarketListComponent } from "../../../markets/components/market-list/market-list.component";

@Component({
  selector: "app-event-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./event-card.component.html",
  styleUrls: ["./event-card.component.css"],
})
export class EventCardComponent {
  @Input() team!: TeamData;
  @Output() onSelect = new EventEmitter<number>();
}
