import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TeamData } from "../../../../core/models/event.model";

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
