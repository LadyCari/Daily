import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./page/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./page/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'extra',
        loadComponent: () => import('./page/Extra/extra.page').then(m => m.ExtraPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./page/settings/settings.page').then(m => m.SettingsPage)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./page/perfil/perfil.page').then(m => m.PerfilPage)
      },
      {
        path: 'forms',
        loadComponent: () => import('./page/forms/forms.page').then(m => m.FormsPage)
      },
      {
        path: 'forms/:id',
        loadComponent: () => import('./page/forms-detail/forms-detail.page').then(m => m.FormsDetailPage)
      },
      {
        path: 'forms/:id/fields',
        loadComponent: () => import('./page/forms-fields/forms-fields.page').then(m => m.FormsFieldsPage)
      },
      {
        path: 'gastos',
        loadComponent: () => import('./page/gastos/gastos.page').then(m => m.GastosPage)
      },
      {
        path: 'gastos/grupo/:id',
        loadComponent: () => import('./page/grupo-detalle/grupo-detalle.page').then(m => m.GrupoDetallePage)
      },
      {
        path: 'compra',
        loadComponent: () => import('./page/compras/compras.page').then(m => m.ComprasPage),
        children: [
          {
            path: '',
            redirectTo: 'tiendas',
            pathMatch: 'full'
          },
          {
            path: 'tiendas',
            loadComponent: () => import('./page/tienda/tienda.page').then(m => m.TiendaPage)
          },
          {
            path: 'productos',
            loadComponent: () => import('./page/producto/producto.page').then(m => m.ProductoPage)
          },
          {
            path: 'tienda/:id',
            loadComponent: () => import('./page/tienda-detail-page/tienda-detail-page.page').then(m => m.TiendaDetailPagePage)
          }
        ]
      },
      {
        path: 'forms-shared',
        loadComponent: () => import('./page/forms-shared/forms-shared.page').then(m => m.FormsSharedPage)
      },
      {
        path: 'grupos',
        loadComponent: () => import('./page/grupos/grupos.page').then(m => m.GruposPage)
      },
      {
        path: 'grupos/:id',
        loadComponent: () => import('./page/grupo-sync/grupo-sync.page').then(m => m.GrupoSyncPage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },

];
