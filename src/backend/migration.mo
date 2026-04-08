import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";

module {

  // ─── Old types (from previous version .most file) ────────────────────────

  type OldApprovalStatus = { #approved; #pending; #rejected };
  type OldApprovalState = {
    var approvalStatus : Map.Map<Principal, OldApprovalStatus>;
  };

  type OldUserRole = { #admin; #sales; #operations };
  type OldUserProfile = {
    principal : Principal;
    name      : Text;
    role      : OldUserRole;
    district  : Text;
    phone     : Text;
    email     : Text;
  };

  type OldRequirement = {
    systemType     : Text;
    panelSize      : Text;
    estimatedValue : Nat;
    notes          : Text;
  };

  type OldPipelineStage = {
    #inquiry;
    #surveyScheduled;
    #bookingConfirmed;
    #installation;
    #closedWon;
    #closedLost;
  };

  type OldLead = {
    id                       : Nat;
    customerName             : Text;
    phone                    : Text;
    email                    : Text;
    address                  : Text;
    district                 : Text;
    requirements             : OldRequirement;
    assignedSalesPerson      : ?Principal;
    assignedOperationsPerson : ?Principal;
    createdBy                : Principal;
    createdAt                : Time.Time;
    updatedAt                : Time.Time;
    stage                    : OldPipelineStage;
    notes                    : Text;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    approvalState      : OldApprovalState;
    userProfiles       : Map.Map<Principal, OldUserProfile>;
    leads              : Map.Map<Nat, OldLead>;
    districts          : List.List<Text>;
    defaultDistricts   : [Text];
    var nextLeadId     : Nat;
  };

  // ─── New types (matching new main.mo) ────────────────────────────────────

  type NewRemark = {
    addedBy : Text;
    addedAt : Time.Time;
    content : Text;
  };

  type NewPipelineStage = {
    #inquiry;
    #surveyScheduled;
    #bookingConfirmed;
    #installation;
    #closedWon;
    #closedLost;
  };

  type NewRequirement = {
    systemType     : Text;
    panelSize      : Text;
    estimatedValue : Nat;
    notes          : Text;
  };

  type NewLead = {
    id                       : Nat;
    customerName             : Text;
    phone                    : Text;
    email                    : Text;
    address                  : Text;
    district                 : Text;
    requirements             : NewRequirement;
    assignedSalesPerson      : ?Text;
    assignedOperationsPerson : ?Text;
    createdBy                : Text;
    createdAt                : Time.Time;
    updatedAt                : Time.Time;
    stage                    : NewPipelineStage;
    notes                    : Text;
    remarks                  : [NewRemark];
  };

  type NewUserRole = {
    #admin;
    #backoffice;
    #sales;
    #operation;
  };

  type NewUserProfile = {
    userId         : Text;
    passwordHash   : Text;
    name           : Text;
    role           : NewUserRole;
    district       : Text;
    phone          : Text;
    email          : Text;
    whatsAppNumber : Text;
    isActive       : Bool;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    users              : Map.Map<Text, NewUserProfile>;
    leads              : Map.Map<Nat, NewLead>;
    districts          : List.List<Text>;
    defaultDistricts   : [Text];
    var nextLeadId     : Nat;
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  func optPrincipalToText(p : ?Principal) : ?Text {
    switch (p) {
      case null    { null };
      case (?prin) { ?prin.toText() };
    };
  };

  func migrateLead(old : OldLead) : NewLead {
    {
      id                       = old.id;
      customerName             = old.customerName;
      phone                    = old.phone;
      email                    = old.email;
      address                  = old.address;
      district                 = old.district;
      requirements             = old.requirements;
      assignedSalesPerson      = optPrincipalToText(old.assignedSalesPerson);
      assignedOperationsPerson = optPrincipalToText(old.assignedOperationsPerson);
      createdBy                = old.createdBy.toText();
      createdAt                = old.createdAt;
      updatedAt                = old.updatedAt;
      stage                    = old.stage;
      notes                    = old.notes;
      remarks                  = [];
    };
  };

  // ─── Migration entry point ────────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    // Drop old approval state and old user profiles intentionally
    ignore old.approvalState;
    ignore old.userProfiles;

    // Migrate leads: convert Principal fields to Text, add empty remarks
    let newLeads = old.leads.map<Nat, OldLead, NewLead>(
      func(_id, oldLead) { migrateLead(oldLead) }
    );

    // Seed admin user — old system had no password-based users
    let newUsers = Map.empty<Text, NewUserProfile>();
    newUsers.add("admin", {
      userId         = "admin";
      passwordHash   = "Admin@1234";
      name           = "Administrator";
      role           = #admin;
      district       = "";
      phone          = "";
      email          = "";
      whatsAppNumber = "";
      isActive       = true;
    });

    {
      accessControlState = old.accessControlState; // pass through unchanged
      users              = newUsers;
      leads              = newLeads;
      districts          = old.districts;
      defaultDistricts   = old.defaultDistricts;
      var nextLeadId     = old.nextLeadId;
    };
  };

};
