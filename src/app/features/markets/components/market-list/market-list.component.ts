import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-market-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./market-list.component.html",
  styleUrls: ["./market-list.component.css"],
})
export class MarketListComponent {
  @Input() markets: any;
  @Input() eventId: string = "";
}
