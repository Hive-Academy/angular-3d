import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="bg-background-dark text-white py-12x mt-20x">
      <div class="max-w-container mx-auto px-4x">
        <div class="grid md:grid-cols-4 gap-8x mb-8x">
          <!-- Column 1: Branding -->
          <div>
            <h3 class="text-headline-sm font-bold text-neon-green mb-3x">
              Hive Academy
            </h3>
            <p class="text-body-md text-text-secondary">
              Angular libraries for 3D and animation experiences
            </p>
          </div>

          <!-- Column 2: Libraries -->
          <div>
            <h4 class="text-body-lg font-semibold mb-3x">Libraries</h4>
            <ul class="space-y-2x">
              <li>
                <a
                  routerLink="/angular-3d"
                  class="text-body-md text-text-secondary hover:text-neon-green"
                >
                  Angular-3D
                </a>
              </li>
              <li>
                <a
                  routerLink="/angular-gsap"
                  class="text-body-md text-text-secondary hover:text-neon-green"
                >
                  Angular-GSAP
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/hive-academy"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-body-md text-text-secondary hover:text-neon-green"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <!-- Column 3: Resources -->
          <div>
            <h4 class="text-body-lg font-semibold mb-3x">Resources</h4>
            <ul class="space-y-2x">
              <li>
                <span class="text-body-md text-text-secondary"
                  >Documentation (Coming Soon)</span
                >
              </li>
              <li>
                <span class="text-body-md text-text-secondary"
                  >Examples (This Demo)</span
                >
              </li>
            </ul>
          </div>

          <!-- Column 4: Community -->
          <div>
            <h4 class="text-body-lg font-semibold mb-3x">Community</h4>
            <ul class="space-y-2x">
              <li>
                <a
                  href="https://github.com/hive-academy/angular-3d/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-body-md text-text-secondary hover:text-neon-green"
                >
                  GitHub Issues
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div
          class="border-t border-gray-700 pt-6x flex justify-between items-center"
        >
          <p class="text-body-sm text-text-secondary">
            © 2025 Hive Academy. MIT License.
          </p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
