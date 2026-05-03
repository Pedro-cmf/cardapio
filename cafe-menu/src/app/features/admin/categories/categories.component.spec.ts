import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoriesComponent } from './categories.component';
import { SupabaseService } from '../../../core/services/supabase.service';

describe('CategoriesComponent - BDD Tests', () => {
  let component: CategoriesComponent;
  let fixture: ComponentFixture<CategoriesComponent>;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;

  beforeEach(async () => {
    // GIVEN: Mock dependencies
    mockSupabaseService = jasmine.createSpyObj('SupabaseService', [
      'getAllEstablishments',
      'getCategoriesByEstablishment',
      'createCategory',
      'updateCategory',
      'deleteCategory'
    ]);

    await TestBed.configureTestingModule({
      imports: [CategoriesComponent, ReactiveFormsModule],
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesComponent);
    component = fixture.componentInstance;
  });

  describe('FEATURE: Category CRUD', () => {
    describe('SCENARIO: Load categories on initialization', () => {
      it('GIVEN establishment exists WHEN component initializes THEN should load categories', async () => {
        // GIVEN
        const mockEstablishments = [
          { id: 'est-1', name: 'Café A', slug: 'cafe-a', primary_color: '#000', secondary_color: '#FFF', accent_color: '#CCC' }
        ];
        const mockCategories = [
          { id: 'cat-1', name: 'Bebidas', order_index: 1, active: true, establishment_id: 'est-1' }
        ];

        mockSupabaseService.getAllEstablishments.and.returnValue(
          Promise.resolve(mockEstablishments)
        );
        mockSupabaseService.getCategoriesByEstablishment.and.returnValue(
          Promise.resolve(mockCategories)
        );

        // WHEN
        await component.ngOnInit();

        // THEN
        expect(component.establishments().length).toBe(1);
        expect(component.categories().length).toBe(1);
        expect(component.selectedEstId()).toBe('est-1');
      });
    });

    describe('SCENARIO: Create new category', () => {
      it('GIVEN valid form data WHEN saving new category THEN should create and reload list', async () => {
        // GIVEN
        component.selectedEstId.set('est-1');
        component.form.patchValue({
          name: 'Nova Categoria',
          order_index: 5,
          active: true
        });

        const createdCategory = {
          id: 'cat-new',
          name: 'Nova Categoria',
          order_index: 5,
          active: true,
          establishment_id: 'est-1'
        };

        mockSupabaseService.createCategory.and.returnValue(
          Promise.resolve(createdCategory)
        );
        mockSupabaseService.getCategoriesByEstablishment.and.returnValue(
          Promise.resolve([createdCategory])
        );

        // WHEN
        await component.save();

        // THEN
        expect(mockSupabaseService.createCategory).toHaveBeenCalledWith({
          name: 'Nova Categoria',
          order_index: 5,
          active: true,
          establishment_id: 'est-1'
        });
        expect(component.editingId()).toBeNull();
      });
    });

    describe('SCENARIO: Edit existing category', () => {
      it('GIVEN category in edit mode WHEN saving THEN should update category', async () => {
        // GIVEN
        const existingCategory = {
          id: 'cat-1',
          name: 'Bebidas',
          order_index: 1,
          active: true,
          establishment_id: 'est-1'
        };

        component.selectedEstId.set('est-1');
        component.openModal(existingCategory);
        component.form.patchValue({ name: 'Bebidas Quentes' });

        const updatedCategory = { ...existingCategory, name: 'Bebidas Quentes' };
        mockSupabaseService.updateCategory.and.returnValue(
          Promise.resolve(updatedCategory)
        );
        mockSupabaseService.getCategoriesByEstablishment.and.returnValue(
          Promise.resolve([updatedCategory])
        );

        // WHEN
        await component.save();

        // THEN
        expect(mockSupabaseService.updateCategory).toHaveBeenCalledWith('cat-1', {
          name: 'Bebidas Quentes',
          order_index: 1,
          active: true,
          establishment_id: 'est-1'
        });
      });
    });

    describe('SCENARIO: Toggle category active status', () => {
      it('GIVEN active category WHEN toggling THEN should set to inactive', async () => {
        // GIVEN
        const category = {
          id: 'cat-1',
          name: 'Bebidas',
          order_index: 1,
          active: true,
          establishment_id: 'est-1'
        };

        mockSupabaseService.updateCategory.and.returnValue(
          Promise.resolve({ ...category, active: false })
        );
        mockSupabaseService.getCategoriesByEstablishment.and.returnValue(
          Promise.resolve([])
        );

        // WHEN
        await component.toggleActive(category);

        // THEN
        expect(mockSupabaseService.updateCategory).toHaveBeenCalledWith('cat-1', {
          active: false
        });
      });
    });

    describe('SCENARIO: Delete category', () => {
      it('GIVEN user confirms WHEN deleting category THEN should remove from database', async () => {
        // GIVEN
        spyOn(window, 'confirm').and.returnValue(true);
        mockSupabaseService.deleteCategory.and.returnValue(Promise.resolve());
        mockSupabaseService.getCategoriesByEstablishment.and.returnValue(
          Promise.resolve([])
        );

        // WHEN
        await component.delete('cat-1');

        // THEN
        expect(mockSupabaseService.deleteCategory).toHaveBeenCalledWith('cat-1');
      });

      it('GIVEN user cancels WHEN attempting to delete THEN should not delete', async () => {
        // GIVEN
        spyOn(window, 'confirm').and.returnValue(false);

        // WHEN
        await component.delete('cat-1');

        // THEN
        expect(mockSupabaseService.deleteCategory).not.toHaveBeenCalled();
      });
    });

    describe('SCENARIO: Cancel edit mode', () => {
      it('GIVEN category being edited WHEN canceling THEN should reset form and editing state', () => {
        // GIVEN
        const category = {
          id: 'cat-1',
          name: 'Bebidas',
          order_index: 1,
          active: true,
          establishment_id: 'est-1'
        };
        component.openModal(category);

        // WHEN
        component.closeModal();

        // THEN
        expect(component.editingId()).toBeNull();
        expect(component.form.get('name')?.value).toBe('');
      });
    });

    describe('SCENARIO: Form validation', () => {
      it('GIVEN invalid form WHEN attempting to save THEN should not submit', async () => {
        // GIVEN
        component.form.patchValue({
          name: '',
          order_index: 0,
          active: true
        });

        // WHEN
        await component.save();

        // THEN
        expect(mockSupabaseService.createCategory).not.toHaveBeenCalled();
        expect(mockSupabaseService.updateCategory).not.toHaveBeenCalled();
      });
    });
  });
});
