
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

  let users       = Map.empty<Text, UserProfile>();
  let sessions    = Map.empty<Text, SessionData>();
  // leads stores OldLead (compatible with pre-quotationSent snapshot) for stable persistence
  let leads       = Map.empty<Nat, OldLead>();
  let quotations  = Map.empty<Text, Quotation>();
  var nextLeadId       : Nat = 1;
  var nextQuotationSeq : Nat = 1;

  // Working map with new Lead type (rebuilt from leads in postupgrade)
  flexible var leadsMap = Map.empty<Nat, Lead>();

  // ─────────────────────────────────────────────
  //  UPGRADE HOOKS
  // ─────────────────────────────────────────────

  system func preupgrade() {
    // Serialize leadsMap back to leads (as OldLead, dropping quotationSent → surveyScheduled for compat)
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
    leadsMap := Map.empty<Nat, Lead>();
    for ((k, oldLead) in leads.entries()) {
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
    leads.clear();
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

  let adminProfile : UserProfile = {
    userId       = "admin";
    passwordHash = "Admin@1234";
    name         = "Administrator";
    role         = #admin;
    district     = "";
    phone        = "";
    email        = "";
    whatsAppNumber = "";
    isActive     = true;
  };
  users.add("admin", adminProfile);

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
    switch (users.get(username)) {
      case null { #err("Invalid username or password") };
      case (?u) {
        if (not u.isActive) { return #err("Account is inactive. Contact admin.") };
        if (u.passwordHash != password) { return #err("Invalid username or password") };
        let token = generateToken(username);
        let sd : SessionData = { userId = username; createdAt = Time.now() };
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
    notes         : Text
  ) : async { #ok : Lead; #err : Text } {
    let caller = requireSession(sessionToken);
    let id = nextLeadId;
    nextLeadId += 1;
    let lead : Lead = {
      id;
      customerName; phone; email; address; district;
      requirements; notes;
      assignedSalesPerson      = null;
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
    sessionToken  : Text,
    leadId        : Nat,
    customerName  : Text,
    phone         : Text,
    email         : Text,
    address       : Text,
    district      : Text,
    requirements  : Requirement,
    notes         : Text
  ) : async { #ok : Lead; #err : Text } {
    let caller = requireSession(sessionToken);
    switch (leadsMap.get(leadId)) {
      case null { #err("Lead not found") };
      case (?existing) {
        if (not canModifyLead(caller.userId, caller.role, existing)) {
          return #err("Unauthorized: you cannot modify this lead");
        };
        let updated : Lead = {
          existing with
          customerName; phone; email; address; district;
          requirements; notes;
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
