import { Component, ViewEncapsulation, signal } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton]
})
export class TabsPage {

  activeTab = signal<string>('home');

  setTab(tab: string) {
    this.activeTab.set(tab);
  }
}
