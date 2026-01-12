import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer
      class="relative bg-background-dark text-white py-12x  border-t border-neon-green/20"
    >
      <!-- Subtle glow effect at top border -->
      <div
        class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green/40 to-transparent"
      ></div>
      <div
        class="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-neon-green/5 to-transparent pointer-events-none"
      ></div>

      <div class="max-w-container mx-auto px-4x">
        <div class="grid md:grid-cols-4 gap-8x mb-8x">
          <!-- Column 1: Branding with Logo -->
          <div>
            <img
              ngSrc="/logo.png"
              alt="Hive Academy"
              width="90"
              height="60"
              class="mb-4x"
              priority
            />
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
