import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-error",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./error.component.html",
  styleUrls: ["./error.component.css"],
})
export class ErrorComponent {
  @Input() title: string = "Error";
  @Input() message: string = "Something went wrong.";
  @Input() retryFn: (() => void) | null = null;
}
