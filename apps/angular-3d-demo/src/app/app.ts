import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { NavigationComponent } from './shared/navigation.component';
import { FooterComponent } from './shared/footer.component';

@Component({
  imports: [RouterOutlet, NavigationComponent, FooterComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected title = 'angular-3d-demo';

  private readonly router = inject(Router);

  /**
   * Whether to render the shared nav + footer chrome. Full-bleed routes opt out
   * via `data: { chrome: false }` in the route config.
   */
  protected readonly showChrome = signal(true);

  public constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.showChrome.set(this.resolveChrome()));
  }

  private resolveChrome(): boolean {
    let route: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data['chrome'] !== false;
  }
}
