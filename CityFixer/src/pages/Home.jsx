import { useClerk } from "@clerk/clerk-react";
import IncidentModal from '../Components/map/IncidentModal';
import { Button } from "../Components/ui/button"; 


function Home() {
  const { signOut } = useClerk();

  return (
    
    <div>
      <h1>Dashboard ciudadano</h1>
      <IncidentModal />
      <button onClick={() => signOut()}>Cerrar sesión</button>
    </div>
  );
}
export default Home;
