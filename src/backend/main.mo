import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Types
  type BloodType = {
    #A_Pos;
    #A_Neg;
    #B_Pos;
    #B_Neg;
    #O_Pos;
    #O_Neg;
    #AB_Pos;
    #AB_Neg;
  };

  module BloodType {
    public func compareByText(bt1 : BloodType, bt2 : BloodType) : Order.Order {
      toText(bt1).compare(toText(bt2));
    };

    public func toText(bloodType : BloodType) : Text {
      switch (bloodType) {
        case (#A_Pos) { "A+" };
        case (#A_Neg) { "A-" };
        case (#B_Pos) { "B+" };
        case (#B_Neg) { "B-" };
        case (#O_Pos) { "O+" };
        case (#O_Neg) { "O-" };
        case (#AB_Pos) { "AB+" };
        case (#AB_Neg) { "AB-" };
      };
    };

    public func toNat(bloodType : BloodType) : Nat {
      switch (bloodType) {
        case (#A_Pos) { 1 };
        case (#A_Neg) { 2 };
        case (#B_Pos) { 3 };
        case (#B_Neg) { 4 };
        case (#O_Pos) { 5 };
        case (#O_Neg) { 6 };
        case (#AB_Pos) { 7 };
        case (#AB_Neg) { 8 };
      };
    };

    public func compareByInventoryEntry(a : (BloodType, Nat), b : (BloodType, Nat)) : Order.Order {
      compareByText(a.0, b.0);
    };
  };

  type Donor = {
    id : Nat;
    name : Text;
    contactPhone : Text;
    email : Text;
    bloodType : BloodType;
    lastDonationDate : Text;
    totalDonations : Nat;
    isActive : Bool;
  };

  module Donor {
    public func compare(d1 : Donor, d2 : Donor) : Order.Order {
      Int.compare(d1.id, d2.id);
    };
  };

  type BloodRequest = {
    id : Nat;
    patientName : Text;
    bloodType : BloodType;
    units : Nat;
    hospital : Text;
    urgency : Text; // "Normal", "Urgent", "Critical"
    status : Text; // "Pending", "Approved", "Fulfilled", "Rejected"
    requestedBy : Text;
    createdAt : Int;
    notes : Text;
  };

  module BloodRequest {
    public func compare(r1 : BloodRequest, r2 : BloodRequest) : Order.Order {
      Int.compare(r1.id, r2.id);
    };
  };

  type DashboardStats = {
    totalDonors : Nat;
    activeDonors : Nat;
    pendingRequests : Nat;
    urgentRequests : Nat;
    totalInventoryUnits : Nat;
    unitsCollectedToday : Nat;
  };

  public type UserProfile = {
    name : Text;
  };

  // Authentication and authorization system setup
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Stable state
  var nextDonorId = 1;
  var nextRequestId = 1;

  let donors = Map.empty<Nat, Donor>();
  let bloodRequests = Map.empty<Nat, BloodRequest>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var A_Pos = 0;
  var A_Neg = 0;
  var B_Pos = 0;
  var B_Neg = 0;
  var O_Pos = 0;
  var O_Neg = 0;
  var AB_Pos = 0;
  var AB_Neg = 0;

  var unitsCollectedToday = 0;

  // User Profile Functions

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Blood Inventory Functions

  public query func getInventory() : async [(BloodType, Nat)] {
    [
      (#A_Pos, A_Pos),
      (#A_Neg, A_Neg),
      (#B_Pos, B_Pos),
      (#B_Neg, B_Neg),
      (#O_Pos, O_Pos),
      (#O_Neg, O_Neg),
      (#AB_Pos, AB_Pos),
      (#AB_Neg, AB_Neg),
    ].sort(BloodType.compareByInventoryEntry);
  };

  public shared ({ caller }) func updateInventory(bloodType : BloodType, units : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update inventory");
    };
    switch (bloodType) {
      case (#A_Pos) { A_Pos += units };
      case (#A_Neg) { A_Neg += units };
      case (#B_Pos) { B_Pos += units };
      case (#B_Neg) { B_Neg += units };
      case (#O_Pos) { O_Pos += units };
      case (#O_Neg) { O_Neg += units };
      case (#AB_Pos) { AB_Pos += units };
      case (#AB_Neg) { AB_Neg += units };
    };
    unitsCollectedToday += units;
  };

  // Donor Management Functions

  public shared ({ caller }) func addDonor(name : Text, contactPhone : Text, email : Text, bloodType : BloodType) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add donors");
    };
    let id = nextDonorId;
    nextDonorId += 1;
    let donor : Donor = {
      id;
      name;
      contactPhone;
      email;
      bloodType;
      lastDonationDate = "";
      totalDonations = 0;
      isActive = true;
    };
    donors.add(id, donor);
    id;
  };

  public shared ({ caller }) func updateDonor(id : Nat, name : Text, contactPhone : Text, email : Text, bloodType : BloodType) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update donors");
    };
    switch (donors.get(id)) {
      case (null) { Runtime.trap("Donor not found") };
      case (?donor) {
        let updatedDonor : Donor = {
          id;
          name;
          contactPhone;
          email;
          bloodType;
          lastDonationDate = donor.lastDonationDate;
          totalDonations = donor.totalDonations;
          isActive = donor.isActive;
        };
        donors.add(id, updatedDonor);
      };
    };
  };

  public shared ({ caller }) func deactivateDonor(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can deactivate donors");
    };
    switch (donors.get(id)) {
      case (null) { Runtime.trap("Donor not found") };
      case (?donor) {
        let updatedDonor : Donor = {
          id;
          name = donor.name;
          contactPhone = donor.contactPhone;
          email = donor.email;
          bloodType = donor.bloodType;
          lastDonationDate = donor.lastDonationDate;
          totalDonations = donor.totalDonations;
          isActive = false;
        };
        donors.add(id, updatedDonor);
      };
    };
  };

  public query func getDonor(id : Nat) : async ?Donor {
    donors.get(id);
  };

  public query func searchDonors(searchText : Text) : async [Donor] {
    donors.values().toArray().filter(func(donor) { donor.name.contains(#text searchText) });
  };

  public query func getAllDonors() : async [Donor] {
    donors.values().toArray().sort();
  };

  // Blood Request Functions

  public shared ({ caller }) func createBloodRequest(patientName : Text, bloodType : BloodType, units : Nat, hospital : Text, urgency : Text, requestedBy : Text, notes : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create blood requests");
    };
    let id = nextRequestId;
    nextRequestId += 1;
    let request : BloodRequest = {
      id;
      patientName;
      bloodType;
      units;
      hospital;
      urgency;
      status = "Pending";
      requestedBy;
      createdAt = Time.now();
      notes;
    };
    bloodRequests.add(id, request);
    id;
  };

  public shared ({ caller }) func updateRequestStatus(id : Nat, status : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update request status");
    };
    switch (bloodRequests.get(id)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) {
        let updatedRequest : BloodRequest = {
          id;
          patientName = request.patientName;
          bloodType = request.bloodType;
          units = request.units;
          hospital = request.hospital;
          urgency = request.urgency;
          status;
          requestedBy = request.requestedBy;
          createdAt = request.createdAt;
          notes = request.notes;
        };
        bloodRequests.add(id, updatedRequest);
      };
    };
  };

  public query func getRequest(id : Nat) : async ?BloodRequest {
    bloodRequests.get(id);
  };

  public query func getAllRequests() : async [BloodRequest] {
    bloodRequests.values().toArray().sort();
  };

  public query func getPendingRequests() : async [BloodRequest] {
    bloodRequests.values().toArray().filter(func(request) { request.status == "Pending" }).sort();
  };

  public query func getUrgentRequests() : async [BloodRequest] {
    bloodRequests.values().toArray().filter(func(request) { request.urgency != "Normal" }).sort();
  };

  // Dashboard Stats

  public query func getDashboardStats() : async DashboardStats {
    let totalDonors = donors.size();
    let activeDonors = donors.values().toArray().filter(func(donor) { donor.isActive }).size();
    let pendingRequests = bloodRequests.values().toArray().filter(func(request) { request.status == "Pending" }).size();
    let urgentRequests = bloodRequests.values().toArray().filter(func(request) { request.urgency != "Normal" }).size();
    let totalInventoryUnits = A_Pos + A_Neg + B_Pos + B_Neg + O_Pos + O_Neg + AB_Pos + AB_Neg;

    {
      totalDonors;
      activeDonors;
      pendingRequests;
      urgentRequests;
      totalInventoryUnits;
      unitsCollectedToday;
    };
  };
};
