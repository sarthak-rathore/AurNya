import { BannersForm } from '@/app/admin/(panel)/banners/banners-form';
import { site } from '@/config/site';
import { DEMO_HERO_IMAGES } from '@/lib/hero-images';
import { requireRole } from '@/lib/role-auth';

export const metadata = { title: 'Website Control' };

export default async function OwnerBanners() {
  await requireRole('owner');
  const ann = {
    visible: site.announcement.visible,
    message: site.announcement.message,
    href: site.announcement.href,
    linkText: site.announcement.linkText,
    start: '',
    end: '',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-white">Website Control</h1>
        <p className="text-xs text-[#968E9F] mt-0.5">
          Manage announcement bar banner and home page hero slideshow images
        </p>
      </div>
      <BannersForm announcement={ann} pictures={DEMO_HERO_IMAGES} />
    </div>
  );
}
