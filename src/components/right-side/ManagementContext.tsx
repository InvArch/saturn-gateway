import SaturnCard from "../legos/SaturnCard";
import ProposeModal from "../modals/ProposeModal";
import HistoryRow from "./HistoryRow";

const ManagementContext = () => {
  return <SaturnCard header="Roster History">
    <HistoryRow timestamp="1634370400000" color="green" activity={["Added new member", "Yaki"]} />
    <HistoryRow timestamp="1644370403000" color="red" user="Crane" activity={["Removed votes", "-5"]} />
    <HistoryRow timestamp="1634270400000" color="green" user="0x123...456" activity={["Added new member", "Dat Phunky Vault"]} />
    <HistoryRow timestamp="1644370402999" color="red" activity={["Deleted member", "Yaki"]} />
    <ProposeModal />
  </SaturnCard>;
};

ManagementContext.displayName = 'MembersContext';
export default ManagementContext;