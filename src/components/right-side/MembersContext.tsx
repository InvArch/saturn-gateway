import SaturnCard from "../legos/SaturnCard";
import HistoryRow from "./HistoryRow";

const MembersContext = () => {
  return <SaturnCard header="Roster History">
    <HistoryRow timestamp="1634370400000" color="green" activity={["Added new member", "Yaki"]} />
    <HistoryRow timestamp="1644370403000" color="red" user="Crane" activity={["Removed votes", "-5"]} />
    <HistoryRow timestamp="1634270400000" color="green" user="0x123...456" activity={["Added new member", "Dat Phunky Vault"]} />
    <HistoryRow timestamp="1644370402999" color="red" activity={["Deleted member", "Yaki"]} />
  </SaturnCard>;
};

MembersContext.displayName = 'MembersContext';
export default MembersContext;