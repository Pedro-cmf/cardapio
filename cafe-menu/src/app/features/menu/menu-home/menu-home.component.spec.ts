import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MenuHomeComponent } from './menu-home.component';
import { SupabaseService } from '../../../core/services/supabase.service';
import { of } from 'rxjs';

describe('MenuHomeComponent - BDD Tests', () => {
  let component: MenuHomeComponent;
  let fixture: ComponentFixture<MenuHomeComponent>;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    // GIVEN: Mock dependencies
    mockSupabaseService = jasmine.createSpyObj('SupabaseService', [
      'getEstablishmentBySlug',
      'getFullMenu'
    ]);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('cafe-clube')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [MenuHomeComponent],
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuHomeComponent);
    component = fixture.componentInstance;
  });

  describe('FEATURE: Public Menu Display', () => {
    describe('SCENARIO: Load menu for valid establishment', () => {
      it('GIVEN valid slug WHEN component initializes THEN should load establishment and menu', async () => {
        // GIVEN
        const mockEstablishment = {
          id: '123',
          name: 'Café Clube',
          slug: 'cafe-clube',
          primary_color: '#1C3829',
          secondary_color: '#F5F0E0',
          accent_color: '#C9A84C'
        };

        const mockCategories = [
          {
            id: 'cat-1',
            name: 'Bebidas',
            establishment_id: '123',
            order_index: 1,
            active: true,
            items: [
              {
                id: 'item-1',
                name: 'Café Expresso',
                price: 5,
                active: true,
                is_promotion: false,
                category_id: 'cat-1'
              }
            ]
          }
        ];

        mockSupabaseService.getEstablishmentBySlug.and.returnValue(
          Promise.resolve(mockEstablishment)
        );
        mockSupabaseService.getFullMenu.and.returnValue(
          Promise.resolve(mockCategories)
        );

        // WHEN
        await component.ngOnInit();

        // THEN
        expect(component.establishment()?.name).toBe('Café Clube');
        expect(component.categories().length).toBe(1);
        expect(component.loading()).toBe(false);
        expect(component.error()).toBe('');
      });
    });

    describe('SCENARIO: Invalid establishment slug', () => {
      it('GIVEN invalid slug WHEN component initializes THEN should show error message', async () => {
        // GIVEN
        mockSupabaseService.getEstablishmentBySlug.and.returnValue(
          Promise.resolve(null)
        );

        // WHEN
        await component.ngOnInit();

        // THEN
        expect(component.error()).toBe('Estabelecimento não encontrado.');
        expect(component.establishment()).toBeNull();
        expect(component.categories().length).toBe(0);
      });
    });

    describe('SCENARIO: Theme application', () => {
      it('GIVEN establishment with custom colors WHEN loading THEN should apply theme to CSS variables', async () => {
        // GIVEN
        const mockEstablishment = {
          id: '123',
          name: 'Café Custom',
          slug: 'cafe-custom',
          primary_color: '#FF0000',
          secondary_color: '#00FF00',
          accent_color: '#0000FF'
        };

        mockSupabaseService.getEstablishmentBySlug.and.returnValue(
          Promise.resolve(mockEstablishment)
        );
        mockSupabaseService.getFullMenu.and.returnValue(Promise.resolve([]));

        // WHEN
        await component.ngOnInit();

        // THEN
        const root = document.documentElement;
        expect(root.style.getPropertyValue('--color-primary')).toBe('#FF0000');
        expect(root.style.getPropertyValue('--color-secondary')).toBe('#00FF00');
        expect(root.style.getPropertyValue('--color-accent')).toBe('#0000FF');
      });
    });

    describe('SCENARIO: Loading state', () => {
      it('GIVEN data is being fetched WHEN checking state THEN should show loading', () => {
        // GIVEN
        fixture.detectChanges();

        // WHEN / THEN
        expect(component.loading()).toBe(true);
      });
    });

    describe('SCENARIO: Network error', () => {
      it('GIVEN network failure WHEN loading menu THEN should show error message', async () => {
        // GIVEN
        const errorMessage = 'Network error';
        mockSupabaseService.getEstablishmentBySlug.and.returnValue(
          Promise.reject({ message: errorMessage })
        );

        // WHEN
        await component.ngOnInit();

        // THEN
        expect(component.error()).toBe(errorMessage);
        expect(component.loading()).toBe(false);
      });
    });
  });
});
