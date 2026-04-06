import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Initialize the user approval system
  let approvalState = UserApproval.initState(accessControlState);

  // Approval functions for authenticated endpoints
  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  type District = Text;
  module District {
    public func compare(district1 : District, district2 : District) : Order.Order {
      Text.compare(district1, district2);
    };
  };

  let districts = List.empty<District>();
  let defaultDistricts = [
    "Ahmedabad", "Vadodara", "Surat", "Rajkot", "Gandhinagar", "Bhavnagar", "Jamnagar", "Junagadh", "Bharuch", "Gujarat_other"
  ];

  districts.addAll(defaultDistricts.values());

  type UserId = Principal;

  type UserRole = {
    #admin;
    #sales;
    #operations;
  };

  type UserProfile = {
    principal : UserId;
    name : Text;
    role : UserRole;
    district : District;
    phone : Text;
    email : Text;
  };

  module UserProfile {
    public func compare(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      Text.compare(profile1.name, profile2.name);
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Helper function to check if user is admin
  func isAdmin(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.role == #admin };
      case null { false };
    };
  };

  // Helper function to check if user is operations
  func isOperations(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.role == #operations };
      case null { false };
    };
  };

  // Helper function to check if user is sales
  func isSales(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.role == #sales };
      case null { false };
    };
  };

  // Helper function to check if user has admin or operations role
  func isAdminOrOperations(caller : Principal) : Bool {
    isAdmin(caller) or isOperations(caller);
  };

  public shared ({ caller }) func addUserProfile(profile : UserProfile) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can add profiles");
    };
    let newProfile : UserProfile = {
      profile with principal = caller
    };
    userProfiles.add(caller, newProfile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view profiles");
    };
    if (caller != user and not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile unless you are an admin");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func updateUserProfile(profile : UserProfile) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can update profiles");
    };
    if (not (userProfiles.containsKey(caller))) {
      Runtime.trap("Unauthorized: Profile does not exist. Please add a profile first.");
    };
    let updatedProfile : UserProfile = {
      profile with principal = caller
    };
    userProfiles.add(caller, updatedProfile);
  };

  type LeadId = Nat;

  public type Requirement = {
    systemType : Text;
    panelSize : Text;
    estimatedValue : Nat;
    notes : Text;
  };

  type PipelineStage = {
    #inquiry;
    #surveyScheduled;
    #bookingConfirmed;
    #installation;
    #closedWon;
    #closedLost;
  };

  public type Lead = {
    id : LeadId;
    customerName : Text;
    phone : Text;
    email : Text;
    address : Text;
    district : District;
    requirements : Requirement;
    assignedSalesPerson : ?UserId;
    assignedOperationsPerson : ?UserId;
    createdBy : UserId;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    stage : PipelineStage;
    notes : Text;
  };

  var nextLeadId = 1;
  let leads = Map.empty<LeadId, Lead>();

  // Helper function to check if caller can access a lead
  func canAccessLead(caller : Principal, lead : Lead) : Bool {
    if (isAdmin(caller)) {
      return true;
    };
    if (isOperations(caller)) {
      return true;
    };
    // Sales can access their own leads
    if (lead.createdBy == caller) {
      return true;
    };
    if (lead.assignedSalesPerson == ?caller) {
      return true;
    };
    if (lead.assignedOperationsPerson == ?caller) {
      return true;
    };
    false;
  };

  // Helper function to check if caller can modify a lead
  func canModifyLead(caller : Principal, lead : Lead) : Bool {
    if (isAdmin(caller)) {
      return true;
    };
    if (isOperations(caller)) {
      return true;
    };
    // Sales can modify their own leads
    if (isSales(caller) and (lead.createdBy == caller or lead.assignedSalesPerson == ?caller)) {
      return true;
    };
    false;
  };

  public shared ({ caller }) func addLead(input : Lead) : async LeadId {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can add leads");
    };
    // Only sales and operations can add leads
    if (not (isSales(caller) or isOperations(caller) or isAdmin(caller))) {
      Runtime.trap("Unauthorized: Only sales staff, operations, or admins can add leads");
    };

    let leadId = nextLeadId;
    nextLeadId += 1;

    let newLead : Lead = {
      input with
      id = leadId;
      createdBy = caller;
      createdAt = Time.now();
      updatedAt = Time.now();
      stage = #inquiry;
      assignedSalesPerson = input.assignedSalesPerson;
      assignedOperationsPerson = input.assignedOperationsPerson;
      requirements = input.requirements;
      notes = input.notes;
    };

    leads.add(leadId, newLead);
    leadId;
  };

  public shared ({ caller }) func updateLead(leadId : LeadId, input : Lead) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can update leads");
    };

    switch (leads.get(leadId)) {
      case null {
        Runtime.trap("Lead not found");
      };
      case (?existingLead) {
        if (not canModifyLead(caller, existingLead)) {
          Runtime.trap("Unauthorized: You can only update your own leads or you must be an admin/operations");
        };

        let updatedLead : Lead = {
          input with
          id = leadId;
          createdBy = existingLead.createdBy;
          createdAt = existingLead.createdAt;
          updatedAt = Time.now();
        };

        leads.add(leadId, updatedLead);
      };
    };
  };

  public shared ({ caller }) func updateLeadStage(leadId : LeadId, stage : PipelineStage, notes : Text) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can update lead stages");
    };

    switch (leads.get(leadId)) {
      case null {
        Runtime.trap("Lead not found");
      };
      case (?existingLead) {
        if (not canModifyLead(caller, existingLead)) {
          Runtime.trap("Unauthorized: You can only update stages for your own leads or you must be an admin/operations");
        };

        let updatedLead : Lead = {
          existingLead with
          stage = stage;
          notes = notes;
          updatedAt = Time.now();
        };

        leads.add(leadId, updatedLead);
      };
    };
  };

  public shared ({ caller }) func assignLeadToSales(leadId : LeadId, salesPerson : UserId) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can assign leads");
    };
    // Only operations and admin can assign leads
    if (not isAdminOrOperations(caller)) {
      Runtime.trap("Unauthorized: Only operations staff or admins can assign leads");
    };

    switch (leads.get(leadId)) {
      case null {
        Runtime.trap("Lead not found");
      };
      case (?existingLead) {
        let updatedLead : Lead = {
          existingLead with
          assignedSalesPerson = ?salesPerson;
          updatedAt = Time.now();
        };

        leads.add(leadId, updatedLead);
      };
    };
  };

  public shared ({ caller }) func assignLeadToOperations(leadId : LeadId, operationsPerson : UserId) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can assign leads");
    };
    // Only operations and admin can assign leads
    if (not isAdminOrOperations(caller)) {
      Runtime.trap("Unauthorized: Only operations staff or admins can assign leads");
    };

    switch (leads.get(leadId)) {
      case null {
        Runtime.trap("Lead not found");
      };
      case (?existingLead) {
        let updatedLead : Lead = {
          existingLead with
          assignedOperationsPerson = ?operationsPerson;
          updatedAt = Time.now();
        };

        leads.add(leadId, updatedLead);
      };
    };
  };

  public query ({ caller }) func getLeadById(leadId : LeadId) : async ?Lead {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view leads");
    };

    switch (leads.get(leadId)) {
      case null { null };
      case (?lead) {
        if (canAccessLead(caller, lead)) {
          ?lead;
        } else {
          Runtime.trap("Unauthorized: You can only view leads you are associated with");
        };
      };
    };
  };

  public query ({ caller }) func getLeadsByDistrict(district : District) : async [Lead] {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view leads");
    };
    // Only admin and operations can view leads by district
    if (not isAdminOrOperations(caller)) {
      Runtime.trap("Unauthorized: Only operations staff or admins can view leads by district");
    };

    leads.values().toArray().filter(func(lead) { Text.equal(lead.district, district) });
  };

  public query ({ caller }) func getLeadsByStage(stage : PipelineStage) : async [Lead] {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view leads");
    };
    // Only admin and operations can view leads by stage
    if (not isAdminOrOperations(caller)) {
      Runtime.trap("Unauthorized: Only operations staff or admins can view leads by stage");
    };

    leads.values().toArray().filter(func(lead) { lead.stage == stage });
  };

  public query ({ caller }) func getLeadsBySalesPerson(salesPerson : UserId) : async [Lead] {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view leads");
    };
    // Only admin and operations can view leads by sales person, or the sales person themselves
    if (not (isAdminOrOperations(caller) or caller == salesPerson)) {
      Runtime.trap("Unauthorized: You can only view your own leads or you must be an admin/operations");
    };

    leads.values().toArray().filter(func(lead) { lead.assignedSalesPerson == ?salesPerson });
  };

  public query ({ caller }) func getMyLeads() : async [Lead] {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view leads");
    };

    leads.values().toArray().filter(func(lead) {
      lead.createdBy == caller or lead.assignedSalesPerson == ?caller or lead.assignedOperationsPerson == ?caller
    });
  };

  public query ({ caller }) func getAllLeads() : async [Lead] {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view leads");
    };
    // Only admin and operations can view all leads
    if (not isAdminOrOperations(caller)) {
      Runtime.trap("Unauthorized: Only operations staff or admins can view all leads");
    };

    leads.values().toArray();
  };

  // KPI queries - admin and operations only
  public query ({ caller }) func getTotalLeadsCount() : async Nat {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view KPIs");
    };
    if (not isAdminOrOperations(caller)) {
      Runtime.trap("Unauthorized: Only operations staff or admins can view KPIs");
    };

    leads.size();
  };

  public query ({ caller }) func getLeadsAddedToday() : async Nat {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view KPIs");
    };
    if (not isAdminOrOperations(caller)) {
      Runtime.trap("Unauthorized: Only operations staff or admins can view KPIs");
    };

    let now = Time.now();
    let oneDayInNanos = 24 * 60 * 60 * 1_000_000_000;
    let todayStart = now - oneDayInNanos;

    leads.values().toArray().filter(func(lead) { lead.createdAt >= todayStart }).size();
  };

  public query ({ caller }) func getLeadsByStageCount() : async [(PipelineStage, Nat)] {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view KPIs");
    };
    if (not isAdminOrOperations(caller)) {
      Runtime.trap("Unauthorized: Only operations staff or admins can view KPIs");
    };

    let allLeads = leads.values().toArray();
    [
      (#inquiry, allLeads.filter(func(l) { l.stage == #inquiry }).size()),
      (#surveyScheduled, allLeads.filter(func(l) { l.stage == #surveyScheduled }).size()),
      (#bookingConfirmed, allLeads.filter(func(l) { l.stage == #bookingConfirmed }).size()),
      (#installation, allLeads.filter(func(l) { l.stage == #installation }).size()),
      (#closedWon, allLeads.filter(func(l) { l.stage == #closedWon }).size()),
      (#closedLost, allLeads.filter(func(l) { l.stage == #closedLost }).size()),
    ];
  };

  public query ({ caller }) func getLeadsByDistrictCount() : async [(District, Nat)] {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view KPIs");
    };
    if (not isAdminOrOperations(caller)) {
      Runtime.trap("Unauthorized: Only operations staff or admins can view KPIs");
    };

    let allLeads = leads.values().toArray();
    districts.toArray().map<District, (District, Nat)>(
      func(district) {
        (district, allLeads.filter(func(l) { Text.equal(l.district, district) }).size());
      }
    );
  };

  // Admin-only: Get all user profiles
  public query ({ caller }) func getAllUserProfiles() : async [UserProfile] {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view user profiles");
    };
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all user profiles");
    };

    userProfiles.values().toArray();
  };

  // Admin-only: Manage districts
  public shared ({ caller }) func addDistrict(district : District) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can manage districts");
    };
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can add districts");
    };

    districts.add(district);
  };

  public query ({ caller }) func getAllDistricts() : async [District] {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved and authenticated users can view districts");
    };

    districts.toArray();
  };
};
