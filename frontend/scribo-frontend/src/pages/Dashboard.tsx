import Navbar from "../components/Navbar";
import { DocumentList } from "../components/DocumentList";
import { mockDocuments } from "@/data/mockData";

const handleAddDocument = () => {}

const Dashboard = () => {
    return (
      <>
        <Navbar />
        <DocumentList documents={mockDocuments} onAddDocument={handleAddDocument} />
      </>
  );
} 

export default Dashboard;