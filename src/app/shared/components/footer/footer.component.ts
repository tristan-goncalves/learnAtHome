import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements AfterViewChecked {
  @ViewChild('aboutSection') aboutSection?: ElementRef;

  year = new Date().getFullYear();
  showAbout = false;
  private shouldScroll = false;

  toggleAbout(): void {
    this.showAbout = !this.showAbout;
    if (this.showAbout) {
      this.shouldScroll = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.aboutSection) {
      this.aboutSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.shouldScroll = false;
    }
  }
}
