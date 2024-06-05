import "@stdlib/deploy";

import "./jetton.tact";

contract HRDroneJetton with Deployable, Jetton {
    totalSupply: Int as coins;
    owner: Address;
    content: Cell;
    mintable: Bool;

    maxSupply: Int as coins;

    init(content: Cell, totalSupply: Int) {
        self.totalSupply = 0;
        self.owner = sender();
        self.mintable = true;
        self.content = content;
        self.maxSupply = totalSupply;
    }

    receive(msg: Mint) {
        self.requireOwner();
        require(self.mintable, "Can't Mint Anymore");
        self.mint(msg.receiver, msg.amount, self.owner); // (to, amount, response_destination)
    }
}
