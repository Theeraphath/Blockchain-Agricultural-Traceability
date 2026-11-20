// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title Blockchain Agricultural Product Traceability
/// @notice Records agricultural product batches, custody transfers, status updates and recalls.
contract AgriculturalTraceability {
    address public admin;

    enum Role {
        None,
        Farmer,
        Transporter,
        Distributor,
        Retailer,
        Inspector
    }

    enum ProductStatus {
        Registered,
        Harvested,
        InTransit,
        AtWarehouse,
        AtRetailer,
        Recalled
    }

    struct Stakeholder {
        string name;
        Role role;
        bool active;
    }

    struct ProductBatch {
        uint256 batchId;
        string productName;
        string origin;
        string harvestDate;
        address farmer;
        address currentOwner;
        ProductStatus status;
        bool recalled;
        bool exists;
    }

    struct HistoryEvent {
        uint256 timestamp;
        address actor;
        string action;
        string details;
    }

    mapping(address => Stakeholder) public stakeholders;
    mapping(uint256 => ProductBatch) private batches;
    mapping(uint256 => HistoryEvent[]) private productHistory;

    uint256 public nextBatchId = 1;

    event StakeholderRegistered(address indexed account, string name, Role role);
    event BatchRegistered(uint256 indexed batchId, string productName, address indexed farmer);
    event CustodyTransferred(uint256 indexed batchId, address indexed from, address indexed to);
    event ProductStatusUpdated(uint256 indexed batchId, ProductStatus status);
    event ProductRecalled(uint256 indexed batchId, string reason);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Admin only");
        _;
    }

    modifier onlyActiveStakeholder() {
        require(stakeholders[msg.sender].active, "Not an active stakeholder");
        _;
    }

    modifier batchExists(uint256 batchId) {
        require(batches[batchId].exists, "Batch does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerStakeholder(
        address account,
        string calldata name,
        Role role
    ) external onlyAdmin {
        require(account != address(0), "Invalid address");
        require(role != Role.None, "Invalid role");
        require(bytes(name).length > 0, "Name is required");

        stakeholders[account] = Stakeholder({
            name: name,
            role: role,
            active: true
        });

        emit StakeholderRegistered(account, name, role);
    }

    function setStakeholderActive(address account, bool active) external onlyAdmin {
        require(stakeholders[account].role != Role.None, "Stakeholder not found");
        stakeholders[account].active = active;
    }

    function registerProductBatch(
        string calldata productName,
        string calldata origin,
        string calldata harvestDate
    ) external onlyActiveStakeholder returns (uint256) {
        require(stakeholders[msg.sender].role == Role.Farmer, "Farmer only");
        require(bytes(productName).length > 0, "Product name is required");
        require(bytes(origin).length > 0, "Origin is required");

        uint256 batchId = nextBatchId++;

        batches[batchId] = ProductBatch({
            batchId: batchId,
            productName: productName,
            origin: origin,
            harvestDate: harvestDate,
            farmer: msg.sender,
            currentOwner: msg.sender,
            status: ProductStatus.Harvested,
            recalled: false,
            exists: true
        });

        _addHistory(batchId, "Batch registered", origin);
        emit BatchRegistered(batchId, productName, msg.sender);
        return batchId;
    }

    function transferCustody(
        uint256 batchId,
        address newOwner,
        string calldata details
    ) external onlyActiveStakeholder batchExists(batchId) {
        ProductBatch storage batch = batches[batchId];

        require(!batch.recalled, "Product has been recalled");
        require(batch.currentOwner == msg.sender, "Not the current owner");
        require(stakeholders[newOwner].active, "New owner is not active");
        require(newOwner != address(0), "Invalid new owner");

        address previousOwner = batch.currentOwner;
        batch.currentOwner = newOwner;
        batch.status = ProductStatus.InTransit;

        _addHistory(batchId, "Custody transferred", details);
        emit CustodyTransferred(batchId, previousOwner, newOwner);
    }

    function updateProductStatus(
        uint256 batchId,
        ProductStatus newStatus,
        string calldata details
    ) external onlyActiveStakeholder batchExists(batchId) {
        ProductBatch storage batch = batches[batchId];

        require(!batch.recalled, "Product has been recalled");
        require(batch.currentOwner == msg.sender, "Current owner only");
        require(newStatus != ProductStatus.Recalled, "Use recallProduct");

        batch.status = newStatus;
        _addHistory(batchId, "Status updated", details);
        emit ProductStatusUpdated(batchId, newStatus);
    }

    function recallProduct(
        uint256 batchId,
        string calldata reason
    ) external onlyAdmin batchExists(batchId) {
        ProductBatch storage batch = batches[batchId];
        require(!batch.recalled, "Already recalled");

        batch.recalled = true;
        batch.status = ProductStatus.Recalled;
        _addHistory(batchId, "Product recalled", reason);
        emit ProductRecalled(batchId, reason);
    }

    /// @notice Public product lookup. The batch ID can be encoded in a QR code.
    function getProduct(uint256 batchId)
        external
        view
        batchExists(batchId)
        returns (ProductBatch memory)
    {
        return batches[batchId];
    }

    function getProductHistory(uint256 batchId)
        external
        view
        batchExists(batchId)
        returns (HistoryEvent[] memory)
    {
        return productHistory[batchId];
    }

    function getHistoryCount(uint256 batchId)
        external
        view
        batchExists(batchId)
        returns (uint256)
    {
        return productHistory[batchId].length;
    }

    function _addHistory(
        uint256 batchId,
        string memory action,
        string memory details
    ) internal {
        productHistory[batchId].push(
            HistoryEvent({
                timestamp: block.timestamp,
                actor: msg.sender,
                action: action,
                details: details
            })
        );
    }
}
