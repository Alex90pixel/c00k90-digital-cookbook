import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header';

/** Layout of the signed-in pages: the header above the current page. */
@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, Header],
  template: `
    <app-header />
    <main>
      <router-outlet />
    </main>
  `,
})
export class ShellLayout {}
