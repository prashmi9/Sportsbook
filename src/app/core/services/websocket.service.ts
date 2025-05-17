import { Injectable, inject, NgZone } from "@angular/core";
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  filter,
  map,
  share,
  tap,
} from "rxjs";
import SockJS from "sockjs-client";
import { Client, IMessage, IFrame } from "@stomp/stompjs";

@Injectable({
  providedIn: "root",
})
export class WebSocketService {
  private client: Client | null = null;
  private zone = inject(NgZone);
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private subscriptions = new Map<
    string,
    { subscription: any; count: number }
  >();
  private messageSubject = new Subject<{ destination: string; message: any }>();

  private serverUrl =
    "http://ec2-13-41-79-73.eu-west-2.compute.amazonaws.com:8080/sportsbook";

  constructor() {
    this.initializeWebSocketConnection();
  }

  private initializeWebSocketConnection() {
    this.client = new Client({
      webSocketFactory: () => new SockJS(this.serverUrl),
      onConnect: () => {
        this.zone.run(() => {
          this.connectionStatus.next(true);
          console.log("Connected to WebSocket server");

          Array.from(this.subscriptions.entries()).forEach(([destination]) => {
            this.createSubscription(destination);
          });
        });
      },
      onDisconnect: () => {
        this.zone.run(() => {
          this.connectionStatus.next(false);
          console.log("Disconnected from WebSocket server");
        });
      },
      onStompError: (frame: IFrame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
      reconnectDelay: 5000,
    });

    this.client.activate();
  }

  private createSubscription(destination: string): void {
    if (!this.client || !this.client.connected) {
      console.warn(`Cannot subscribe to ${destination}: client not connected`);
      return;
    }

    const stompSubscription = this.client.subscribe(
      destination,
      (message: IMessage) => {
        this.zone.run(() => {
          let parsedMessage;
          try {
            parsedMessage = JSON.parse(message.body);
          } catch (e) {
            parsedMessage = message.body;
          }
          this.messageSubject.next({ destination, message: parsedMessage });
        });
      }
    );

    const existing = this.subscriptions.get(destination);
    if (existing) {
      existing.subscription = stompSubscription;
    } else {
      this.subscriptions.set(destination, {
        subscription: stompSubscription,
        count: 1,
      });
    }
  }

  public isConnected(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  public subscribe(destination: string): Observable<any> {
    const messageStream = this.messageSubject.pipe(
      filter((msg) => msg.destination === destination),
      map((msg) => msg.message),
      share()
    );

    const subscriptionInfo = this.subscriptions.get(destination);
    if (subscriptionInfo) {
      subscriptionInfo.count++;
      this.subscriptions.set(destination, subscriptionInfo);
    } else {
      this.subscriptions.set(destination, { subscription: null, count: 1 });
      if (this.client && this.client.connected) {
        this.createSubscription(destination);
      }
    }

    return messageStream;
  }

  public unsubscribe(destination: string): void {
    const subscriptionInfo = this.subscriptions.get(destination);
    if (subscriptionInfo) {
      subscriptionInfo.count--;

      if (subscriptionInfo.count <= 0) {
        if (subscriptionInfo.subscription) {
          subscriptionInfo.subscription.unsubscribe();
        }
        this.subscriptions.delete(destination);
        console.log(`Unsubscribed from ${destination}`);
      } else {
        this.subscriptions.set(destination, subscriptionInfo);
      }
    }
  }

  public disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.subscriptions.clear();
    }
  }
}
