import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminRoute from '../../components/admin/AdminRoute';
import {
  AdminCustomerSideContent,
  AdminCustomerSideIntro,
  AdminCustomerSideModals,
  AdminCustomerSideStats,
  AdminCustomerSideTabs
} from '../../components/admin/AdminCustomerSideSections';
import { useAdminContext } from '../../context/AdminContext';
import { useCustomerContent } from '../../context/CustomerContentContext';
import { createNavItem } from '../../utils/customerContentHelpers';
import { confirmDelete, confirmDialog } from '../../utils/sweetAlert';

const AdminCustomerSideContentPage = () => {
  const navigate = useNavigate();
  const { adminUser, adminLogout } = useAdminContext();
  const {
    content,
    draftSavedAt,
    saving,
    error,
    resetToDefaults,
    updateNavigation,
    addNavigationItem,
    deleteNavigationItem,
    updateShowcaseHeading,
    updateShowcaseCategory,
    addShowcaseCategory,
    deleteShowcaseCategory,
    updateCollectionHero,
    toggleCollectionHeroVisibility,
    updateHeroSlide,
    toggleHeroSlideVisibility,
    addHeroSlide,
    deleteHeroSlide,
    updateShopTheLookMeta,
    updateShopLookItem,
    addShopLookItem,
    deleteShopLookItem,
    updateAuthPageBanner,
    updateFooterSocial,
    updateCommerceSettings
  } = useCustomerContent();

  const [activeTab, setActiveTab] = useState('navigation');
  const [modal, setModal] = useState(null);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  const closeModal = () => setModal(null);

  return (
    <div className="admin-shell">
      <AdminHeader adminUser={adminUser} onLogout={handleLogout} />

      <main className="admin-shell-main admin-storefront-page">
        <nav className="admin-product-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/admin">Dashboard</Link>
          <span aria-hidden="true">&gt;</span>
          <span className="admin-product-breadcrumbs-current">Dynamic Customer Side</span>
        </nav>

        <AdminCustomerSideIntro
          draftSavedAt={draftSavedAt}
          saving={saving}
          error={error}
          onReset={async () => {
            const confirmed = await confirmDialog({
              title: 'Reset storefront?',
              text: 'All dynamic content will return to default settings.',
              confirmText: 'Reset',
              danger: true
            });

            if (confirmed) {
              resetToDefaults();
            }
          }}
          onPreview={() => window.open('/', '_blank', 'noopener,noreferrer')}
        />

        <AdminCustomerSideStats content={content} />
        <AdminCustomerSideTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <AdminCustomerSideContent
          content={content}
          activeTab={activeTab}
          onAddNav={() => setModal({ type: 'nav', item: createNavItem(), isNew: true })}
          onEditNav={(item) => setModal({ type: 'nav', item, isNew: false })}
          onDeleteNav={async (item) => {
            const confirmed = await confirmDelete(
              'Delete navigation link?',
              `"${item.label}" will be removed from the header.`
            );

            if (!confirmed) {
              return;
            }

            await deleteNavigationItem(item.id);
          }}
          onAddHero={() => addHeroSlide()}
          onEditHero={(item) => setModal({ type: 'hero', item })}
          onDeleteHero={async (item) => {
            const confirmed = await confirmDelete(
              'Delete hero slide?',
              'This banner will be removed from the homepage.'
            );

            if (confirmed) {
              await deleteHeroSlide(item.id);
            }
          }}
          onToggleHeroVisible={async (item) => {
            await toggleHeroSlideVisibility(item.id);
          }}
          onEditShowcaseHeading={updateShowcaseHeading}
          onAddCategory={() => addShowcaseCategory()}
          onEditCategory={(item) => setModal({ type: 'showcase', item })}
          onDeleteCategory={async (item) => {
            const confirmed = await confirmDelete(
              'Delete category?',
              `"${item.title}" and its navigation link will be removed.`
            );

            if (confirmed) {
              deleteShowcaseCategory(item.id);
            }
          }}
          onEditCollectionHero={(slug, hero, category) =>
            setModal({ type: 'collection-hero', slug, item: hero, category })
          }
          onToggleCollectionHeroVisible={async (slug) => {
            await toggleCollectionHeroVisibility(slug);
          }}
          onEditShopMeta={updateShopTheLookMeta}
          onAddShopLook={() => addShopLookItem()}
          onEditShopLook={(item) => setModal({ type: 'shop-look', item })}
          onDeleteShopLook={async (item) => {
            const confirmed = await confirmDelete(
              'Delete shop-the-look post?',
              'This post will be removed from the storefront.'
            );

            if (confirmed) {
              deleteShopLookItem(item.id);
            }
          }}
          onUpdateAuthPageBanner={async (pageKey, updates) => {
            await updateAuthPageBanner(pageKey, updates);
          }}
          onUpdateFooterSocial={updateFooterSocial}
          onUpdateCommerceSettings={updateCommerceSettings}
        />

        <AdminCustomerSideModals
          modal={modal}
          onClose={closeModal}
          onSaveNav={async (form) => {
            if (content.navigation.some((item) => item.id === form.id)) {
              updateNavigation(form.id, form);
            } else {
              addNavigationItem(form);
            }
            closeModal();
          }}
          onSaveHero={async (form) => {
            await updateHeroSlide(form.id, {
              ...form,
              visible: form.visible !== false
            });
            closeModal();
          }}
          onSaveCategory={(form) => {
            if (content.showcase.categories.some((item) => item.id === form.id)) {
              updateShowcaseCategory(form.id, form);
            } else {
              addShowcaseCategory(form);
            }
            closeModal();
          }}
          onSaveCollectionHero={async (form) => {
            await updateCollectionHero(form.slug, {
              titleFirst: form.titleFirst,
              titleSecond: form.titleSecond,
              objectPosition: form.objectPosition,
              visible: form.visible !== false,
              image: form.image?.jpg ? form.image : null
            });
            closeModal();
          }}
          onSaveShopLook={(form) => {
            updateShopLookItem(form.id, form);
            closeModal();
          }}
        />
      </main>
    </div>
  );
};

const AdminCustomerSide = () => (
  <AdminRoute>
    <AdminCustomerSideContentPage />
  </AdminRoute>
);

export default AdminCustomerSide;
