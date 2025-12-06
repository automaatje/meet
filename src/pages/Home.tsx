import Layout from '../components/Layout';
import Dashboard from './Dashboard';
import Customers from './Customers';
import Projects from './Projects';
import WorkOrders from './WorkOrders';
import Invoices from './Invoices';
import Settings from './Settings';
import { useStore } from '../store/useStore';

export default function Home() {
  const { activeTab } = useStore();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 0:
        return <Dashboard />;
      case 1:
        return <Customers />;
      case 2:
        return <Projects />;
      case 3:
        return <WorkOrders />;
      case 4:
        return <Invoices />;
      case 5:
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderActiveTab()}
    </Layout>
  );
}
