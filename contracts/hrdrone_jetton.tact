import "@stdlib/deploy";

import "./imports/jetton";

contract HRDroneJetton with Deployable, Jetton {
    total_supply: Int as coins;
    owner: Address;
    content: Cell;
    mintable: Bool;

    max_supply: Int as coins;

    init(content: Cell, total_supply: Int) {
        self.total_supply = 0;
        self.owner = sender();
        self.content = content;
        self.mintable = true;
        self.max_supply = total_supply;
    }

    receive(msg: Mint) {
        self.requireOwner();
        require(self.mintable, "Can't Mint Anymore");
        self.mint(msg.receiver, msg.amount, self.owner); // (to, amount, response_destination)
    }
}
