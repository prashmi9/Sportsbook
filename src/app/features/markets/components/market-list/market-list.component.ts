import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MarketData } from "../../../../core/models/market.model";

@Component({
  selector: "app-market-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./market-list.component.html",
  styleUrls: ["./market-list.component.css"],
})
export class MarketListComponent {
  @Input() markets?: MarketData;
}
