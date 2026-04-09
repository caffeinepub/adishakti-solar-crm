
import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import AccessControl "mo:caffeineai-authorization/access-control";






actor {

  // Authorization mixin (retained for platform lint compliance)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ─────────────────────────────────────────────
  //  TYPES
  // ─────────────────────────────────────────────

  public type UserRole = {
    #admin;
    #backoffice;
    #sales;
    #operation;
  };

  public type UserProfile = {
    userId    : Text;
    passwordHash : Text; // stored as plaintext for now
    name      : Text;
    role      : UserRole;
    district  : Text;
    phone     : Text;
    email     : Text;
    whatsAppNumber : Text;
    isActive  : Bool;
  };

  type SessionData = {
    userId    : Text;
    createdAt : Time.Time;
  };

  public type Requirement = {
    systemType     : Text;
    panelSize      : Text;
    estimatedValue : Nat;
    notes          : Text;
  };

  public type PipelineStage = {
    #inquiry;
    #surveyScheduled;
    #quotationSent;
    #bookingConfirmed;
    #installation;
    #closedWon;
    #closedLost;
  };

  public type Remark = {
    addedBy  : Text; // userId
    addedAt  : Time.Time;
    content  : Text;
  };

  public type Lead = {
    id                      : Nat;
    customerName            : Text;
    phone                   : Text;
    email                   : Text;
    address                 : Text;
    district                : Text;
    requirements            : Requirement;
    assignedSalesPerson     : ?Text; // userId
    assignedOperationsPerson : ?Text; // userId
    createdBy               : Text; // userId
    createdAt               : Time.Time;
    updatedAt               : Time.Time;
    stage                   : PipelineStage;
    notes                   : Text;
    remarks                 : [Remark];
  };

  // ─────────────────────────────────────────────
  //  QUOTATION REQUEST TYPES
  // ─────────────────────────────────────────────

  public type QuotationRequestStatus = {
    #pending;
    #confirmed;
  };

  public type QuotationRequest = {
    id              : Text;
    leadId          : Nat;
    requestedBy     : Text; // sales userId
    requestedByName : Text;
    requestedAt     : Time.Time;
    quotationRefId  : Text;
    status          : QuotationRequestStatus;
    confirmedAt     : ?Time.Time;
    confirmedBy     : ?Text;
    confirmedByName : ?Text;
  };

  // ─────────────────────────────────────────────
  //  QUOTATION TYPES
  // ─────────────────────────────────────────────

  public type QuotationItem = {
    itemName    : Text;
    description : Text;
    quantity    : Float;
    unitPrice   : Float;
  };

  public type QuotationStatus = {
    #draft;
    #sent;
    #accepted;
    #rejected;
  };

  public type Quotation = {
    id              : Text;
    leadId          : Text;
    quotationNumber : Text;
    createdAt       : Time.Time;
    updatedAt       : Time.Time;
    createdBy       : Text;
    customerName    : Text;
    customerAddress : Text;
    systemType      : Text;
    panelCapacity   : Float;
    items           : [QuotationItem];
    subtotal        : Float;
    gstPercent      : Float;
    gstAmount       : Float;
    totalAmount     : Float;
    notes           : Text;
    validityDays    : Nat;
    status          : QuotationStatus;
  };

  public type QuotationInput = {
    customerName    : Text;
    customerAddress : Text;
    systemType      : Text;
    panelCapacity   : Float;
    items           : [QuotationItem];
    gstPercent      : Float;
    notes           : Text;
    validityDays    : Nat;
  };

  // ─────────────────────────────────────────────
  //  MIGRATION TYPES (old schema — 6-stage pipeline)
  // ─────────────────────────────────────────────

  type OldPipelineStage = {
    #inquiry;
    #surveyScheduled;
    #bookingConfirmed;
    #installation;
    #closedWon;
    #closedLost;
  };

  type OldLead = {
    id                      : Nat;
    customerName            : Text;
    phone                   : Text;
    email                   : Text;
    address                 : Text;
    district                : Text;
    requirements            : Requirement;
    assignedSalesPerson     : ?Text;
    assignedOperationsPerson : ?Text;
    createdBy               : Text;
    createdAt               : Time.Time;
    updatedAt               : Time.Time;
    stage                   : OldPipelineStage;
    notes                   : Text;
    remarks                 : [Remark];
  };

  func migrateStage(old : OldPipelineStage) : PipelineStage {
    switch old {
      case (#inquiry)          { #inquiry };
      case (#surveyScheduled)  { #surveyScheduled };
      case (#bookingConfirmed) { #bookingConfirmed };
      case (#installation)     { #installation };
      case (#closedWon)        { #closedWon };
      case (#closedLost)       { #closedLost };
    };
  };

  // ─────────────────────────────────────────────
  //  STATE
  // ─────────────────────────────────────────────

  // All Map state is flexible var so it survives upgrades via enhanced orthogonal persistence
  flexible var users             = Map.empty<Text, UserProfile>();
  flexible var sessions          = Map.empty<Text, SessionData>();
  // leads stores OldLead (compatible with pre-quotationSent snapshot) for stable persistence
  let leads              = Map.empty<Nat, OldLead>();
  flexible var quotations         = Map.empty<Text, Quotation>();
  flexible var quotationRequests  = Map.empty<Text, QuotationRequest>();
  // Counters kept as stable `var` so they carry over naturally on upgrade
  var nextLeadId              : Nat = 1;
  var nextQuotationSeq        : Nat = 1;
  var nextQuotationRequestSeq : Nat = 1;

  // Feature toggle: when true, sales staff can create their own leads and self-assign
  flexible var allowSalesLeadGeneration : Bool = false;

  // Working map with new Lead type (rebuilt from leads in postupgrade)
  flexible var leadsMap = Map.empty<Nat, Lead>();

  // Legacy stable arrays kept only for one-time migration from old heap-only Maps.
  // Once postupgrade drains them into the flexible var maps above, they stay empty forever.
  flexible var stableUsers             : [(Text, UserProfile)]       = [];
  flexible var stableSessions          : [(Text, SessionData)]        = [];
  flexible var stableQuotationRequests : [(Text, QuotationRequest)]  = [];

  // ─────────────────────────────────────────────
  //  UPGRADE HOOKS
  // ─────────────────────────────────────────────

  system func preupgrade() {
    // All primary state (users, sessions, quotations, quotationRequests, leadsMap,
    // nextLeadId, nextQuotationSeq, nextQuotationRequestSeq) are flexible var — they
    // survive upgrades automatically via enhanced orthogonal persistence.
    // No manual serialisation needed.

    // Persist leadsMap back into the OldLead-typed leads Map so the old snapshot
    // format is preserved for any future downgrade compatibility.
    for ((k, l) in leadsMap.entries()) {
      let oldStage : OldPipelineStage = switch (l.stage) {
        case (#inquiry)          { #inquiry };
        case (#surveyScheduled)  { #surveyScheduled };
        case (#quotationSent)    { #surveyScheduled }; // map back to nearest stage for old snapshot
        case (#bookingConfirmed) { #bookingConfirmed };
        case (#installation)     { #installation };
        case (#closedWon)        { #closedWon };
        case (#closedLost)       { #closedLost };
      };
      let ol : OldLead = {
        id                       = l.id;
        customerName             = l.customerName;
        phone                    = l.phone;
        email                    = l.email;
        address                  = l.address;
        district                 = l.district;
        requirements             = l.requirements;
        assignedSalesPerson      = l.assignedSalesPerson;
        assignedOperationsPerson = l.assignedOperationsPerson;
        createdBy                = l.createdBy;
        createdAt                = l.createdAt;
        updatedAt                = l.updatedAt;
        stage                    = oldStage;
        notes                    = l.notes;
        remarks                  = l.remarks;
      };
      leads.add(k, ol);
    };
  };

  system func postupgrade() {
    // ONE-TIME MIGRATION: drain any legacy stableUsers/stableSessions/stableQuotationRequests
    // arrays left by a previous version that used heap-only Maps + manual serialisation.
    // On all subsequent upgrades these arrays will already be empty, so this is a no-op.
    for ((k, v) in stableUsers.values()) {
      switch (users.get(k)) {
        case null { users.add(k, v) };
        case (?_) {}; // already present in flexible var map — keep existing
      };
    };
    stableUsers := [];

    let now = Time.now();
    for ((k, v) in stableSessions.values()) {
      let age : Int = now - v.createdAt;
      if (age <= sessionTtlNanos) {
        switch (sessions.get(k)) {
          case null { sessions.add(k, v) };
          case (?_) {};
        };
      };
    };
    stableSessions := [];

    for ((k, v) in stableQuotationRequests.values()) {
      switch (quotationRequests.get(k)) {
        case null { quotationRequests.add(k, v) };
        case (?_) {};
      };
    };
    stableQuotationRequests := [];

    // Rebuild leadsMap from stable leads array (schema migration — OldLead → Lead)
    for ((k, oldLead) in leads.entries()) {
      if (leadsMap.get(k) == null) {
        let newLead : Lead = {
          id                       = oldLead.id;
          customerName             = oldLead.customerName;
          phone                    = oldLead.phone;
          email                    = oldLead.email;
          address                  = oldLead.address;
          district                 = oldLead.district;
          requirements             = oldLead.requirements;
          assignedSalesPerson      = oldLead.assignedSalesPerson;
          assignedOperationsPerson = oldLead.assignedOperationsPerson;
          createdBy                = oldLead.createdBy;
          createdAt                = oldLead.createdAt;
          updatedAt                = oldLead.updatedAt;
          stage                    = migrateStage(oldLead.stage);
          notes                    = oldLead.notes;
          remarks                  = oldLead.remarks;
        };
        leadsMap.add(k, newLead);
      };
    };
    leads.clear();

    // Ensure admin account always exists — idempotent: only creates if missing
    ensureAdminExists();
  };

  // ─────────────────────────────────────────────
  //  DISTRICTS — fixed, Odisha-only
  // ─────────────────────────────────────────────

  let odishaDistricts : [Text] = [
    "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak",
    "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati",
    "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi",
    "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput",
    "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada",
    "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"
  ];

  // ─────────────────────────────────────────────
  //  INIT — seed admin
  // ─────────────────────────────────────────────

  // Single authoritative function for seeding admin — idempotent, never overwrites
  func ensureAdminExists() {
    switch (users.get("admin")) {
      case null {
        users.add("admin", {
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
      };
      case (?_) {}; // admin already present — leave untouched
    };
  };

  // Called on fresh deploy (no postupgrade runs on first install)
  ensureAdminExists();

  // ─────────────────────────────────────────────
  //  INTERNAL HELPERS
  // ─────────────────────────────────────────────

  let sessionTtlNanos : Int = 24 * 60 * 60 * 1_000_000_000; // 24 hours

  func generateToken(userId : Text) : Text {
    let ts = Time.now().toText();
    userId # "_" # ts;
  };

  // Returns ?userId if token is valid and not expired
  func resolveSession(token : Text) : ?Text {
    switch (sessions.get(token)) {
      case null { null };
      case (?sd) {
        let age : Int = Time.now() - sd.createdAt;
        if (age > sessionTtlNanos) {
          sessions.remove(token);
          null;
        } else {
          ?sd.userId;
        };
      };
    };
  };

  // Returns ?UserProfile if session is valid
  func getSessionUser(token : Text) : ?UserProfile {
    switch (resolveSession(token)) {
      case null { null };
      case (?uid) { users.get(uid) };
    };
  };

  func requireSession(token : Text) : UserProfile {
    switch (getSessionUser(token)) {
      case null { Runtime.trap("Unauthorized: invalid or expired session") };
      case (?u) {
        if (not u.isActive) { Runtime.trap("Unauthorized: account is inactive") };
        u;
      };
    };
  };

  func requireAdmin(token : Text) : UserProfile {
    let u = requireSession(token);
    if (u.role != #admin) { Runtime.trap("Unauthorized: admin access required") };
    u;
  };

  // Admin or backoffice can assign leads / create quotations
  func canAssignLeads(role : UserRole) : Bool {
    role == #admin or role == #backoffice;
  };

  // Admin, backoffice, and operation can view all leads
  func canViewAllLeads(role : UserRole) : Bool {
    role == #admin or role == #backoffice or role == #operation;
  };

  // Sales can only view their own assigned leads
  func canAccessLead(userId : Text, role : UserRole, lead : Lead) : Bool {
    if (canViewAllLeads(role)) { return true };
    lead.assignedSalesPerson == ?userId or lead.createdBy == userId;
  };

  func canModifyLead(userId : Text, role : UserRole, lead : Lead) : Bool {
    if (role == #admin or role == #operation or role == #backoffice) { return true };
    if (role == #sales and (lead.assignedSalesPerson == ?userId or lead.createdBy == userId)) {
      return true;
    };
    false;
  };

  // Pad number to 3 digits
  func padNat(n : Nat) : Text {
    let s = n.toText();
    if (n < 10)  { "00" # s }
    else if (n < 100) { "0" # s }
    else { s };
  };

  // Generate quotation number: QT-YYYY-NNN
  func nextQuotationNumber() : Text {
    // Time.now() is nanoseconds since epoch (Int)
    // Approximate year from nanoseconds
    let nsPerYear : Int = 365 * 24 * 60 * 60 * 1_000_000_000;
    let epochYear = 1970;
    let yearsSince = (Time.now() / nsPerYear).toNat();
    let year = epochYear + yearsSince;
    let seq = nextQuotationSeq;
    nextQuotationSeq += 1;
    "QT-" # year.toText() # "-" # padNat(seq);
  };

  // Compute subtotal, gstAmount, totalAmount from items + gstPercent
  func computeTotals(items : [QuotationItem], gstPercent : Float) : (Float, Float, Float) {
    var sub : Float = 0.0;
    for (item in items.values()) {
      sub += item.quantity * item.unitPrice;
    };
    let gst = sub * gstPercent / 100.0;
    (sub, gst, sub + gst);
  };

  // ─────────────────────────────────────────────
  //  AUTHENTICATION
  // ─────────────────────────────────────────────

  public shared func login(username : Text, password : Text) : async { #ok : Text; #err : Text } {
    let trimmedUsername = username.trim(#predicate(func(c : Char) : Bool { c == ' ' or c == '\t' or c == '\n' or c == '\r' }));
    let trimmedPassword = password.trim(#predicate(func(c : Char) : Bool { c == ' ' or c == '\t' or c == '\n' or c == '\r' }));
    switch (users.get(trimmedUsername)) {
      case null { #err("Invalid username or password") };
      case (?u) {
        if (not u.isActive) { return #err("Account is inactive. Contact admin.") };
        if (u.passwordHash != trimmedPassword) { return #err("Invalid username or password") };
        let token = generateToken(trimmedUsername);
        let sd : SessionData = { userId = trimmedUsername; createdAt = Time.now() };
        sessions.add(token, sd);
        #ok(token);
      };
    };
  };

  public shared func logout(sessionToken : Text) : async () {
    sessions.remove(sessionToken);
  };

  public query func validateSession(sessionToken : Text) : async ?Text {
    resolveSession(sessionToken);
  };

  // ─────────────────────────────────────────────
  //  USER MANAGEMENT
  // ─────────────────────────────────────────────

  public shared func createUser(
    sessionToken  : Text,
    userId        : Text,
    password      : Text,
    name          : Text,
    role          : UserRole,
    district      : Text,
    phone         : Text,
    email         : Text,
    whatsAppNumber : Text
  ) : async { #ok : (); #err : Text } {
    ignore requireAdmin(sessionToken);
    if (userId == "") { return #err("userId cannot be empty") };
    switch (users.get(userId)) {
      case (?_) { return #err("User ID already exists") };
      case null {};
    };
    let profile : UserProfile = {
      userId; passwordHash = password; name; role;
      district; phone; email; whatsAppNumber; isActive = true;
    };
    users.add(userId, profile);
    #ok(());
  };

  public shared func updateUser(
    sessionToken  : Text,
    userId        : Text,
    name          : Text,
    district      : Text,
    phone         : Text,
    email         : Text,
    whatsAppNumber : Text,
    isActive      : Bool
  ) : async { #ok : (); #err : Text } {
    ignore requireAdmin(sessionToken);
    switch (users.get(userId)) {
      case null { #err("User not found") };
      case (?existing) {
        let updated : UserProfile = {
          existing with
          name; district; phone; email; whatsAppNumber; isActive;
        };
        users.add(userId, updated);
        #ok(());
      };
    };
  };

  public shared func changePassword(
    sessionToken : Text,
    userId       : Text,
    newPassword  : Text
  ) : async { #ok : (); #err : Text } {
    let caller = requireSession(sessionToken);
    // Admin can change anyone's; user can only change their own
    if (caller.role != #admin and caller.userId != userId) {
      return #err("Unauthorized: you can only change your own password");
    };
    switch (users.get(userId)) {
      case null { #err("User not found") };
      case (?existing) {
        let updated : UserProfile = { existing with passwordHash = newPassword };
        users.add(userId, updated);
        #ok(());
      };
    };
  };

  public query func getAllUsers(sessionToken : Text) : async { #ok : [UserProfile]; #err : Text } {
    let caller = requireSession(sessionToken);
    if (caller.role != #admin) { return #err("Unauthorized: admin access required") };
    #ok(users.values().toArray());
  };

  public query func getUserById(sessionToken : Text, userId : Text) : async { #ok : UserProfile; #err : Text } {
    ignore requireSession(sessionToken);
    switch (users.get(userId)) {
      case null { #err("User not found") };
      case (?u) { #ok(u) };
    };
  };

  public query func getMyProfile(sessionToken : Text) : async { #ok : UserProfile; #err : Text } {
    let caller = requireSession(sessionToken);
    #ok(caller);
  };

  // ─────────────────────────────────────────────
  //  LEADS
  // ─────────────────────────────────────────────

  public shared func addLead(
    sessionToken  : Text,
    customerName  : Text,
    phone         : Text,
    email         : Text,
    address       : Text,
    district      : Text,
    requirements  : Requirement,
    notes         : Text,
    salesUserId   : ?Text
  ) : async { #ok : Lead; #err : Text } {
    let caller = requireSession(sessionToken);
    // Sales staff can only create leads when the toggle is enabled
    if (caller.role == #sales and not allowSalesLeadGeneration) {
      return #err("Sales lead generation is not enabled");
    };
    // Determine the sales assignment:
    // 1. Admin/backoffice providing an explicit salesUserId → validate and assign
    // 2. Sales user creating their own lead → auto-assign to themselves
    // 3. Otherwise → unassigned
    let assignedSalesPerson : ?Text = switch (salesUserId) {
      case (?uid) {
        if (canAssignLeads(caller.role)) {
          // Validate the target user exists and has the sales role
          switch (users.get(uid)) {
            case null { return #err("Sales user not found") };
            case (?u) {
              if (u.role != #sales) {
                return #err("Target user does not have the sales role");
              };
              ?uid;
            };
          };
        } else {
          // Sales staff cannot specify an arbitrary userId — ignore and self-assign
          if (caller.role == #sales) { ?caller.userId } else { null };
        };
      };
      case null {
        if (caller.role == #sales) { ?caller.userId } else { null };
      };
    };
    let id = nextLeadId;
    nextLeadId += 1;
    let lead : Lead = {
      id;
      customerName; phone; email; address; district;
      requirements; notes;
      assignedSalesPerson;
      assignedOperationsPerson = null;
      createdBy = caller.userId;
      createdAt = Time.now();
      updatedAt = Time.now();
      stage     = #inquiry;
      remarks   = [];
    };
    leadsMap.add(id, lead);
    #ok(lead);
  };

  public shared func updateLead(
    sessionToken        : Text,
    leadId              : Nat,
    customerName        : Text,
    phone               : Text,
    email               : Text,
    address             : Text,
    district            : Text,
    requirements        : Requirement,
    notes               : Text,
    assignedSalesPerson : ?Text
  ) : async { #ok : Lead; #err : Text } {
    let caller = requireSession(sessionToken);
    switch (leadsMap.get(leadId)) {
      case null { #err("Lead not found") };
      case (?existing) {
        if (not canModifyLead(caller.userId, caller.role, existing)) {
          return #err("Unauthorized: you cannot modify this lead");
        };
        // Resolve the new sales assignment:
        // Admin/backoffice can update it via the optional param; others leave it unchanged.
        let newAssignment : ?Text = switch (assignedSalesPerson) {
          case (?uid) {
            if (canAssignLeads(caller.role)) {
              // Validate the target user exists and has the sales role
              switch (users.get(uid)) {
                case null { return #err("Sales user not found") };
                case (?u) {
                  if (u.role != #sales) {
                    return #err("Target user does not have the sales role");
                  };
                  ?uid;
                };
              };
            } else {
              existing.assignedSalesPerson; // non-admin/backoffice cannot change assignment
            };
          };
          case null {
            existing.assignedSalesPerson; // null means "no change"
          };
        };
        let updated : Lead = {
          existing with
          customerName; phone; email; address; district;
          requirements; notes;
          assignedSalesPerson = newAssignment;
          updatedAt = Time.now();
        };
        leadsMap.add(leadId, updated);
        #ok(updated);
      };
    };
  };

  public shared func updateLeadStage(
    sessionToken : Text,
    leadId       : Nat,
    stage        : PipelineStage,
    notes        : Text
  ) : async { #ok : Lead; #err : Text } {
    let caller = requireSession(sessionToken);
    switch (leadsMap.get(leadId)) {
      case null { #err("Lead not found") };
      case (?existing) {
        if (not canModifyLead(caller.userId, caller.role, existing)) {
          return #err("Unauthorized: you cannot update this lead");
        };
        let updated : Lead = {
          existing with stage; notes; updatedAt = Time.now();
        };
        leadsMap.add(leadId, updated);
        #ok(updated);
      };
    };
  };

  public shared func assignLeadToSales(
    sessionToken : Text,
    leadId       : Nat,
    salesUserId  : Text
  ) : async { #ok : Lead; #err : Text } {
    let caller = requireSession(sessionToken);
    if (not canAssignLeads(caller.role)) {
      return #err("Unauthorized: only admin and backoffice can assign leads");
    };
    // Validate target user exists and has sales role
    switch (users.get(salesUserId)) {
      case null { return #err("Sales user not found") };
      case (?u) {
        if (u.role != #sales) {
          return #err("Target user does not have the sales role");
        };
      };
    };
    switch (leadsMap.get(leadId)) {
      case null { #err("Lead not found") };
      case (?existing) {
        let updated : Lead = {
          existing with
          assignedSalesPerson = ?salesUserId;
          updatedAt = Time.now();
        };
        leadsMap.add(leadId, updated);
        #ok(updated);
      };
    };
  };

  public shared func assignLeadToOperations(
    sessionToken       : Text,
    leadId             : Nat,
    operationsUserId   : Text
  ) : async { #ok : Lead; #err : Text } {
    let caller = requireSession(sessionToken);
    if (not canAssignLeads(caller.role)) {
      return #err("Unauthorized: only admin and backoffice can assign leads");
    };
    // Validate target user exists and has operation role
    switch (users.get(operationsUserId)) {
      case null { return #err("Operations user not found") };
      case (?u) {
        if (u.role != #operation) {
          return #err("Target user does not have the operation role");
        };
      };
    };
    switch (leadsMap.get(leadId)) {
      case null { #err("Lead not found") };
      case (?existing) {
        let updated : Lead = {
          existing with
          assignedOperationsPerson = ?operationsUserId;
          updatedAt = Time.now();
        };
        leadsMap.add(leadId, updated);
        #ok(updated);
      };
    };
  };

  public query func getLeadById(sessionToken : Text, leadId : Nat) : async { #ok : Lead; #err : Text } {
    let caller = requireSession(sessionToken);
    switch (leadsMap.get(leadId)) {
      case null { #err("Lead not found") };
      case (?lead) {
        if (not canAccessLead(caller.userId, caller.role, lead)) {
          return #err("Unauthorized: you cannot access this lead");
        };
        #ok(lead);
      };
    };
  };

  public query func getAllLeads(sessionToken : Text) : async { #ok : [Lead]; #err : Text } {
    let caller = requireSession(sessionToken);
    if (not canViewAllLeads(caller.role)) {
      return #err("Unauthorized: only admin, backoffice, and operation can view all leads");
    };
    #ok(leadsMap.values().toArray());
  };

  public query func getMyLeads(sessionToken : Text) : async { #ok : [Lead]; #err : Text } {
    let caller = requireSession(sessionToken);
    if (canViewAllLeads(caller.role)) {
      return #ok(leadsMap.values().toArray());
    };
    // Sales — return only assigned leads
    let mine = leadsMap.values().toArray().filter(func(l : Lead) : Bool {
      l.assignedSalesPerson == ?caller.userId or l.createdBy == caller.userId
    });
    #ok(mine);
  };

  public query func getLeadsByDistrict(sessionToken : Text, district : Text) : async { #ok : [Lead]; #err : Text } {
    let caller = requireSession(sessionToken);
    if (not canViewAllLeads(caller.role)) {
      return #err("Unauthorized: only admin, backoffice, and operation can filter by district");
    };
    #ok(leadsMap.values().toArray().filter(func(l : Lead) : Bool { Text.equal(l.district, district) }));
  };

  public query func getLeadsByStage(sessionToken : Text, stage : PipelineStage) : async { #ok : [Lead]; #err : Text } {
    let caller = requireSession(sessionToken);
    if (not canViewAllLeads(caller.role)) {
      return #err("Unauthorized: only admin, backoffice, and operation can filter by stage");
    };
    #ok(leadsMap.values().toArray().filter(func(l : Lead) : Bool { l.stage == stage }));
  };

  public query func getTotalLeadsCount(sessionToken : Text) : async { #ok : Nat; #err : Text } {
    let caller = requireSession(sessionToken);
    if (not canViewAllLeads(caller.role)) {
      return #err("Unauthorized: admin, backoffice, or operation access required");
    };
    #ok(leadsMap.size());
  };

  public query func getLeadsAddedToday(sessionToken : Text) : async { #ok : Nat; #err : Text } {
    let caller = requireSession(sessionToken);
    if (not canViewAllLeads(caller.role)) {
      return #err("Unauthorized: admin, backoffice, or operation access required");
    };
    let now = Time.now();
    let oneDayNanos : Int = 24 * 60 * 60 * 1_000_000_000;
    let todayStart  : Int = now - oneDayNanos;
    let count = leadsMap.values().toArray().filter(func(l : Lead) : Bool {
      l.createdAt >= todayStart
    }).size();
    #ok(count);
  };

  public query func getLeadsByStageCount(sessionToken : Text) : async { #ok : [(PipelineStage, Nat)]; #err : Text } {
    let caller = requireSession(sessionToken);
    if (not canViewAllLeads(caller.role)) {
      return #err("Unauthorized: admin, backoffice, or operation access required");
    };
    let all = leadsMap.values().toArray();
    #ok([
      (#inquiry,          all.filter(func(l : Lead) : Bool { l.stage == #inquiry          }).size()),
      (#surveyScheduled,  all.filter(func(l : Lead) : Bool { l.stage == #surveyScheduled  }).size()),
      (#quotationSent,    all.filter(func(l : Lead) : Bool { l.stage == #quotationSent    }).size()),
      (#bookingConfirmed, all.filter(func(l : Lead) : Bool { l.stage == #bookingConfirmed }).size()),
      (#installation,     all.filter(func(l : Lead) : Bool { l.stage == #installation     }).size()),
      (#closedWon,        all.filter(func(l : Lead) : Bool { l.stage == #closedWon        }).size()),
      (#closedLost,       all.filter(func(l : Lead) : Bool { l.stage == #closedLost       }).size()),
    ]);
  };

  public query func getLeadsByDistrictCount(sessionToken : Text) : async { #ok : [(Text, Nat)]; #err : Text } {
    let caller = requireSession(sessionToken);
    if (not canViewAllLeads(caller.role)) {
      return #err("Unauthorized: admin, backoffice, or operation access required");
    };
    let all = leadsMap.values().toArray();
    #ok(
      odishaDistricts.map<Text, (Text, Nat)>(func(d : Text) : (Text, Nat) {
        (d, all.filter(func(l : Lead) : Bool { Text.equal(l.district, d) }).size())
      })
    );
  };

  // ─────────────────────────────────────────────
  //  REMARKS
  // ─────────────────────────────────────────────

  public shared func addRemark(
    sessionToken : Text,
    leadId       : Nat,
    content      : Text
  ) : async { #ok : Lead; #err : Text } {
    let caller = requireSession(sessionToken);
    switch (leadsMap.get(leadId)) {
      case null { #err("Lead not found") };
      case (?existing) {
        if (not canAccessLead(caller.userId, caller.role, existing)) {
          return #err("Unauthorized: you cannot access this lead");
        };
        let remark : Remark = {
          addedBy = caller.userId;
          addedAt = Time.now();
          content;
        };
        // Prepend so newest-first
        let updatedRemarks = [remark].concat(existing.remarks);
        let updated : Lead = {
          existing with
          remarks   = updatedRemarks;
          updatedAt = Time.now();
        };
        leadsMap.add(leadId, updated);
        #ok(updated);
      };
    };
  };

  // ─────────────────────────────────────────────
  //  DISTRICTS — Odisha only, read-only
  // ─────────────────────────────────────────────

  public query func getAllDistricts() : async [Text] {
    odishaDistricts;
  };

  // seedDistricts kept for compatibility — always returns the fixed Odisha list
  public query func seedDistricts() : async [Text] {
    odishaDistricts;
  };

  // ─────────────────────────────────────────────
  //  QUOTATIONS
  // ─────────────────────────────────────────────

  public shared func createQuotation(
    sessionToken : Text,
    leadId       : Text,
    data         : QuotationInput
  ) : async { #ok : Quotation; #err : Text } {
    let caller = requireSession(sessionToken);
    if (not canAssignLeads(caller.role)) {
      return #err("Unauthorized: only admin and backoffice can create quotations");
    };
    let qNum = nextQuotationNumber();
    let qId  = qNum; // quotation number doubles as unique id
    let (sub, gst, total) = computeTotals(data.items, data.gstPercent);
    let q : Quotation = {
      id              = qId;
      leadId;
      quotationNumber = qNum;
      createdAt       = Time.now();
      updatedAt       = Time.now();
      createdBy       = caller.userId;
      customerName    = data.customerName;
      customerAddress = data.customerAddress;
      systemType      = data.systemType;
      panelCapacity   = data.panelCapacity;
      items           = data.items;
      subtotal        = sub;
      gstPercent      = data.gstPercent;
      gstAmount       = gst;
      totalAmount     = total;
      notes           = data.notes;
      validityDays    = data.validityDays;
      status          = #draft;
    };
    quotations.add(qId, q);
    #ok(q);
  };

  public shared func updateQuotation(
    sessionToken : Text,
    id           : Text,
    data         : QuotationInput
  ) : async { #ok : Quotation; #err : Text } {
    let caller = requireSession(sessionToken);
    switch (quotations.get(id)) {
      case null { #err("Quotation not found") };
      case (?existing) {
        // Admin, backoffice, or the original creator can update
        if (caller.role != #admin and caller.role != #backoffice and caller.userId != existing.createdBy) {
          return #err("Unauthorized: you cannot update this quotation");
        };
        let (sub, gst, total) = computeTotals(data.items, data.gstPercent);
        let updated : Quotation = {
          existing with
          updatedAt       = Time.now();
          customerName    = data.customerName;
          customerAddress = data.customerAddress;
          systemType      = data.systemType;
          panelCapacity   = data.panelCapacity;
          items           = data.items;
          subtotal        = sub;
          gstPercent      = data.gstPercent;
          gstAmount       = gst;
          totalAmount     = total;
          notes           = data.notes;
          validityDays    = data.validityDays;
        };
        quotations.add(id, updated);
        #ok(updated);
      };
    };
  };

  public query func getQuotationsByLead(sessionToken : Text, leadId : Text) : async { #ok : [Quotation]; #err : Text } {
    ignore requireSession(sessionToken);
    #ok(quotations.values().toArray().filter(func(q : Quotation) : Bool { Text.equal(q.leadId, leadId) }));
  };

  public query func getQuotationById(sessionToken : Text, id : Text) : async { #ok : ?Quotation; #err : Text } {
    ignore requireSession(sessionToken);
    #ok(quotations.get(id));
  };

  public shared func updateQuotationStatus(
    sessionToken : Text,
    id           : Text,
    status       : QuotationStatus
  ) : async { #ok : Quotation; #err : Text } {
    let caller = requireSession(sessionToken);
    switch (quotations.get(id)) {
      case null { #err("Quotation not found") };
      case (?existing) {
        if (caller.role != #admin and caller.role != #backoffice and caller.userId != existing.createdBy) {
          return #err("Unauthorized: you cannot update this quotation's status");
        };
        let updated : Quotation = {
          existing with status; updatedAt = Time.now();
        };
        quotations.add(id, updated);
        #ok(updated);
      };
    };
  };

  public query func getAllQuotations(sessionToken : Text) : async { #ok : [Quotation]; #err : Text } {
    let caller = requireSession(sessionToken);
    if (not canViewAllLeads(caller.role)) {
      return #err("Unauthorized: admin, backoffice, or operation access required");
    };
    #ok(quotations.values().toArray());
  };

  // Generate quotation request ID: QR-NNN
  func nextQuotationRequestId() : Text {
    let seq = nextQuotationRequestSeq;
    nextQuotationRequestSeq += 1;
    "QR-" # padNat(seq);
  };

  // ─────────────────────────────────────────────
  //  QUOTATION REQUESTS
  // ─────────────────────────────────────────────

  /// Sales requests a quotation for a lead. Creates a QuotationRequest with #pending status.
  /// Does NOT change the lead stage. Adds a remark to the lead.
  public shared func requestQuotation(
    sessionToken   : Text,
    leadId         : Nat,
    quotationRefId : Text
  ) : async { #ok : QuotationRequest; #err : Text } {
    let caller = requireSession(sessionToken);
    if (caller.role != #sales) {
      return #err("Unauthorized: only sales staff can request quotations");
    };
    switch (leadsMap.get(leadId)) {
      case null { #err("Lead not found") };
      case (?existing) {
        if (not canAccessLead(caller.userId, caller.role, existing)) {
          return #err("Unauthorized: you cannot access this lead");
        };
        let reqId = nextQuotationRequestId();
        let req : QuotationRequest = {
          id              = reqId;
          leadId;
          requestedBy     = caller.userId;
          requestedByName = caller.name;
          requestedAt     = Time.now();
          quotationRefId;
          status          = #pending;
          confirmedAt     = null;
          confirmedBy     = null;
          confirmedByName = null;
        };
        quotationRequests.add(reqId, req);
        // Add remark to the lead
        let remarkContent = "Quotation requested by " # caller.name # " - Ref: " # quotationRefId;
        let remark : Remark = {
          addedBy = caller.userId;
          addedAt = Time.now();
          content = remarkContent;
        };
        let updatedRemarks = [remark].concat(existing.remarks);
        let updatedLead : Lead = {
          existing with
          remarks   = updatedRemarks;
          updatedAt = Time.now();
        };
        leadsMap.add(leadId, updatedLead);
        #ok(req);
      };
    };
  };

  /// Returns all QuotationRequests with #pending status. Accessible by backoffice and admin.
  public query func getPendingQuotationRequests(
    sessionToken : Text
  ) : async { #ok : [QuotationRequest]; #err : Text } {
    let caller = requireSession(sessionToken);
    if (caller.role != #admin and caller.role != #backoffice) {
      return #err("Unauthorized: only admin and backoffice can view quotation requests");
    };
    #ok(quotationRequests.values().toArray().filter(func(r : QuotationRequest) : Bool {
      r.status == #pending
    }));
  };

  /// Returns all QuotationRequests regardless of status. Accessible by backoffice and admin.
  public query func getAllQuotationRequests(
    sessionToken : Text
  ) : async { #ok : [QuotationRequest]; #err : Text } {
    let caller = requireSession(sessionToken);
    if (caller.role != #admin and caller.role != #backoffice) {
      return #err("Unauthorized: only admin and backoffice can view quotation requests");
    };
    #ok(quotationRequests.values().toArray());
  };

  /// Backoffice/admin confirms a quotation request. Sets status to #confirmed,
  /// moves the lead to #quotationSent, and adds a remark.
  public shared func confirmQuotationRequest(
    sessionToken : Text,
    requestId    : Text
  ) : async { #ok : QuotationRequest; #err : Text } {
    let caller = requireSession(sessionToken);
    if (caller.role != #admin and caller.role != #backoffice) {
      return #err("Unauthorized: only admin and backoffice can confirm quotation requests");
    };
    switch (quotationRequests.get(requestId)) {
      case null { #err("Quotation request not found") };
      case (?req) {
        if (req.status == #confirmed) {
          return #err("Quotation request is already confirmed");
        };
        let confirmed : QuotationRequest = {
          req with
          status          = #confirmed;
          confirmedAt     = ?Time.now();
          confirmedBy     = ?caller.userId;
          confirmedByName = ?caller.name;
        };
        quotationRequests.add(requestId, confirmed);
        // Move lead to #quotationSent and add remark
        switch (leadsMap.get(req.leadId)) {
          case null {};
          case (?existing) {
            let remarkContent = "Quotation confirmed sent by " # caller.name;
            let remark : Remark = {
              addedBy = caller.userId;
              addedAt = Time.now();
              content = remarkContent;
            };
            let updatedRemarks = [remark].concat(existing.remarks);
            let updatedLead : Lead = {
              existing with
              stage     = #quotationSent;
              remarks   = updatedRemarks;
              updatedAt = Time.now();
            };
            leadsMap.add(req.leadId, updatedLead);
          };
        };
        #ok(confirmed);
      };
    };
  };

  // ─────────────────────────────────────────────
  //  SALES LEAD GENERATION TOGGLE
  // ─────────────────────────────────────────────

  /// Returns the current value of the sales lead generation toggle.
  /// Any authenticated user can read this.
  public query func getSalesLeadGenerationToggle(sessionToken : Text) : async { #ok : Bool; #err : Text } {
    ignore requireSession(sessionToken);
    #ok(allowSalesLeadGeneration);
  };

  /// Admin-only: enable or disable sales staff from creating and self-assigning their own leads.
  public shared func setSalesLeadGenerationToggle(
    sessionToken : Text,
    enabled      : Bool
  ) : async { #ok : (); #err : Text } {
    ignore requireAdmin(sessionToken);
    allowSalesLeadGeneration := enabled;
    #ok(());
  };

  // ─────────────────────────────────────────────
  //  DELETION (admin only)
  // ─────────────────────────────────────────────

  public shared func deleteLead(
    sessionToken : Text,
    leadId       : Nat
  ) : async { #ok : Text; #err : Text } {
    let caller = requireSession(sessionToken);
    if (caller.role != #admin) {
      return #err("Unauthorized: only admin can delete leads");
    };
    switch (leadsMap.get(leadId)) {
      case null { #err("Lead not found") };
      case (?_existing) {
        // Hard-delete the lead
        leadsMap.remove(leadId);
        // Hard-delete all quotations associated with this lead
        let leadIdText = leadId.toText();
        let toDelete = quotations.values().toArray().filter(
          func(q : Quotation) : Bool { Text.equal(q.leadId, leadIdText) }
        );
        for (q in toDelete.values()) {
          quotations.remove(q.id);
        };
        #ok("Lead and associated quotations deleted successfully");
      };
    };
  };

  public shared func deleteUser(
    sessionToken : Text,
    userId       : Text
  ) : async { #ok : Text; #err : Text } {
    let caller = requireSession(sessionToken);
    if (caller.role != #admin) {
      return #err("Unauthorized: only admin can delete users");
    };
    switch (users.get(userId)) {
      case null { #err("User not found") };
      case (?target) {
        // Prevent deleting the last admin account
        if (target.role == #admin) {
          let adminCount = users.values().toArray().filter(
            func(u : UserProfile) : Bool { u.role == #admin }
          ).size();
          if (adminCount <= 1) {
            return #err("Cannot delete the last admin account");
          };
        };
        users.remove(userId);
        #ok("User deleted successfully");
      };
    };
  };

};
