import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MarketData } from "../../../../core/models/market.model";

@Component({
  selector: "app-market-item",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./market-item.component.html",
  styleUrls: ["./market-item.component.css"],
})
export class MarketItemComponent {
  @Input() market!: MarketData;

  ngOnChanges(): void {}
}
