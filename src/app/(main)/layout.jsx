import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}