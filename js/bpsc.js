/**
 *
 *		BATTLE PIRATES SHIP CALCULATOR (0.1)
 *		A web app for calculating and comparing ship builds for Battle Pirates.
 *
 *		1-31-2015
 *		ken.sugiura@gmail.com
 *
 *		* This site is not endorsed by or affiliated with Kixeye or Battle Pirates.
 *
 *		MIT License
 *
 */

// BPSC Namespace

;(function (window, document, undefined) {

"use strict";

//-//--0g//
//
// GLOBALS 
//
//-////////////////

var PTYPE = {
	T : ["Hull", "Weapon", "Armor", "Special", "Tactical"],
	P : [ "H", "W", "A", "S", "T"],
	S : [   1,  16,   8,   6,   1],
	C : ["hull", "weap", "armr", "spec", "tact"]
};

var kWT = {
	NONE : 0,
	CANN : 1, MISS : 2, MORT : 3, RCKT : 4,
	TORP : 5, DPCH : 6, DEFS : 7,
	UAVS : 8, LNCH : 9
};

var kDT = {
	NON  : 0,
	BAL  : 1, PEN  : 2, EXP : 3, CNC : 4,
	AMRT : 5, APEN : 6, RAD : 7,

	SHIP : 10, BLDG : 20, SBMG : 40, WALL : 30
};

//-//--0mn//
//
// MAIN 
//
//-////////////////

var bpa = (function () {

	var result = {};

	//
	// Data Classes
	//

	var createResCost  = (function () {

		// Resource cost
		function ResCost (a) {
			if (a) this.push.apply(this, a);
			else   this.push.apply(this, [0,0,0,0,0]);
		}
		ResCost.prototype           = Object.create(Array.prototype);
		ResCost.prototype.clone     = function () {return new ResCost(this);};
		ResCost.prototype.setSum    = function (rhs) {
			this[0] += rhs[0];
			this[1] += rhs[1];
			this[2] += rhs[2];
			this[3] += rhs[3];
			this[4] += rhs[4];
			return this;
		};
		ResCost.prototype.getSum    = function (rhs) {
			var result = this.clone();
			result.setSum(rhs);
			return result;
		};
		ResCost.prototype.printTime = function () {return bpa.numToTime(this[0]);};

		return function (a) {return new ResCost(a);};

	})();

	var createModSet   = (function () {

		var MF_LIB = {
			mAdd : function (v) {return this.val + v;},
			mPrd : function (v) {return this.val * (v);},
			mUBl : function (v) {return this.val || v;},
			pStr : function ()  {return this.val.toString();},
			pNPc : function ()  {return bpa.numToPercent(1 - this.val);},
			pVPc : function ()  {return bpa.numToPercent(this.val);},
			pPPc : function ()  {return bpa.numToPercent(this.val - 1);}
		};

		var MOD_LIB = {
			// TODO: TslwRst dfSbmg

			// ship basic
			"arm"   : {name : "Armor",               defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"crg"   : {name : "Cargo",               defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },

			// ship submarine combat
			"snr"   : {name : "Detection\xA0Range",  defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"vsr"   : {name : "Visible\xA0Range",    defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },

			// ship movement
			"msp_f" : {name : "Map\xA0Speed",        defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"csp_f" : {name : "Combat\xA0Speed",     defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"tsp_f" : {name : "Turn\xA0Speed",       defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"evd_f" : {name : "Evade",               defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"msp"   : {name : "Map\xA0Speed",        defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"csp"   : {name : "Combat\xA0Speed",     defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"tsp"   : {name : "Turn\xA0Speed",       defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"evd"   : {name : "Evade",               defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pNPc },

			// ship submarine properties
			"tSrf"  : {name : "Surface\xA0Time",     defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"tClk"  : {name : "Cloak\xA0Time",       defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"mClk"  : {name : "Cloak\xA0Time",       defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"eClk"  : {name : "Cloak\xA0Efficiency", defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pNPc },

			// ship defense bonuses
			"dfB_f" : {name : "Bal\xA0Defense",          defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"dfP_f" : {name : "Pen\xA0Defense",          defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"dfE_f" : {name : "Exp\xA0Defense",          defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"dfC_f" : {name : "Cnc\xA0Defense",          defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"dfU_f" : {name : "Rad\xA0Defense",          defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"dfB"   : {name : "Bal\xA0Defense",          defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pNPc },
			"dfP"   : {name : "Pen\xA0Defense",          defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pNPc },
			"dfE"   : {name : "Exp\xA0Defense",          defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pNPc },
			"dfC"   : {name : "Cnc\xA0Defense",          defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pNPc },
			"dfU"   : {name : "Rad\xA0Defense",          defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pNPc },
			"fdB"   : {name : "Bal\xA0Flat\xA0Defense",  defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"fdP"   : {name : "Pen\xA0Flat\xA0Defense",  defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"fdE"   : {name : "Exp\xA0Flat\xA0Defense",  defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"fdC"   : {name : "Cnc\xA0Flat\xA0Defense",  defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"fdU"   : {name : "Rad\xA0Flat\xA0Defense",  defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },

			// ship build and repair time
			"tBld"  : {name : "Build\xA0Time",           defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pNPc },
			"tRpr"  : {name : "Repair\xA0Time",          defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pNPc },

			// ship weight modifiers
			"wtTot" : {name : "Total\xA0Weight",         defVal : 1, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"wtWpn" : {name : "Weapon\xA0Weight",        defVal : 1, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"wtAmr" : {name : "Armor\xA0Weight",         defVal : 1, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"wtTct" : {name : "Tact\xA0Mod\xA0Weight",   defVal : 1, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },

			// weapon range
			"rgN"   : {name : "Range",              defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rgB"   : {name : "Bal\xA0Range",       defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rgP"   : {name : "Pen\xA0Range",       defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rgR"   : {name : "Rocket\xA0Range",    defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rgAM"  : {name : "Anti-Mort\xA0Range", defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rgAP"  : {name : "Anti-Miss\xA0Range", defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rgU"   : {name : "Rad\xA0Range",       defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },

			// weapon reload
			"rlN"   : {name : "Reload",             defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rlB"   : {name : "Bal\xA0Reload",      defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rlP"   : {name : "Pen\xA0Reload",      defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rlE"   : {name : "Exp\xA0Reload",      defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rlC"   : {name : "Cnc\xA0Reload",      defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rlM"   : {name : "Mortar\xA0Reload",   defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rlR"   : {name : "Rocket\xA0Reload",   defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"rlU"   : {name : "Rad\xA0Reload",      defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },

			// weapon damage
			"dmN"    : {name : "Damage",            defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"dmB"    : {name : "Bal\xA0Damage",     defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"dmP"    : {name : "Pen\xA0Damage",     defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"dmE"    : {name : "Exp\xA0Damage",     defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"dmC"    : {name : "Con\xA0Damage",     defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"dmBldg" : {name : "Bldg\xA0Damage",    defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"dmWall" : {name : "Wall\xA0Damage",    defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"dmSbmg" : {name : "Sbmg\xA0Damage",    defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"dmUAV"  : {name : "UAV\xA0Damage",     defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },

			// weapon bonus damage
			"bDmB"   : {name : "Bal\xA0Damage",     defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"bDmP"   : {name : "Pen\xA0Damage",     defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"bDmE"   : {name : "Exp\xA0Damage",     defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"bDmC"   : {name : "Cnc\xA0Damage",     defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"bDmU"   : {name : "Rad\xA0Damage",     defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },

			// weapon accuracy
			"acN"    : {name : "Accuracy",              defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"acB"    : {name : "Bal\xA0Accuracy",       defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"acP"    : {name : "Pen\xA0Accuracy",       defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"acAM"   : {name : "Anti-Mort\xA0Accuracy", defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"acAP"   : {name : "Anti-Miss\xA0Accuracy", defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },

			// weapon splash and spread
			"spl"    : {name : "Splash",             defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"spr"    : {name : "Spread",             defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },

			// weapon prefire delay
			"preF"   : {name : "Prefire\xA0Delay",     defVal : 0,     stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },

			// weapon is stationary
			"stat"    : {name : "Only\xA0fires\xA0when\xA0ship\xA0is\xA0still",      
												      defVal : false, stack : MF_LIB.mUBl, getStat : MF_LIB.pStr },
			// weapon pierce
			"rgPirc"  : {name : "Pierce\xA0Range",    defVal : 0,    stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },
			"dcyPirc" : {name : "Pierce\xA0Decay",    defVal : 0,    stack : MF_LIB.mPrd, getStat : MF_LIB.pPPc },

			// weapon stun effects
			"slw"     : {name : "Slow\xA0Effect",     defVal : 0,    stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },
			"slwMax"  : {name : "Slow\xA0Max",        defVal : 0.75, stack : MF_LIB.mAdd, getStat : MF_LIB.pVPc },

			// weapon misc
			"fev" : {name : "Flak\xA0Evade",      defVal : 1,     stack : MF_LIB.mPrd, getStat : MF_LIB.pNPc },
			"wev" : {name : "Wall\xA0Evade",      defVal : 1,     stack : MF_LIB.mPrd, getStat : MF_LIB.pNPc },
			"ret" : {name : "Retargetable",       defVal : false, stack : MF_LIB.mUBl, getStat : MF_LIB.pStr },

			// weapon UAV properties
			"swrmT"  : {name : "Swarm\xA0Duration", defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },
			"swrmRl" : {name : "Swarm\xA0Reload",   defVal : 0, stack : MF_LIB.mAdd, getStat : MF_LIB.pStr },

			// tactical drone multiplier
			"xDrn"   : {name : "x\xA0Drones",       defVal : 1, stack : MF_LIB.mPrd, getStat : MF_LIB.pStr }

		};

		function getUnknownMod (s) {
			return {
				name    : "Unrecognized\xA0mod\xA0\"" + s + "\"",
				defVal  : 0,
				stack   : function () {return this.val;},
				getStat : MF_LIB.pStr
			};
		}

		function Modifier (s, v) {
			// Expects: String s, Variable v,
			// Constructs: Modifier
			this._mType = MOD_LIB[s] || getUnknownMod(s);
			this.val    = (v !== undefined && v !== null)? v : this._mType.defVal;
		}
		Modifier.prototype.valueOf  = function (v) {return this.val;};
		Modifier.prototype.getStack = function (v) {
			return this._mType.stack.call(this, v);
		};
		Modifier.prototype.setStack = function (v) {
			this.val = this._mType.stack.call(this, v);
			return this;
		};
		Modifier.prototype.getName  = function () {return this._mType.name;};
		Modifier.prototype.getStat  = function () {return this._mType.getStat.call(this);};
		Modifier.prototype.print    = function () {
			return this._mType.name + ":\xA0" + this._mType.getStat.call(this);
		};	

		function ModSet (o) {
			if (o)
				for (var i in o) if (o.hasOwnProperty(i))
					this.setVal(i, o[i]);
		}
		ModSet.prototype.clone    = function () {
			var result = new ModSet();
			for (var i in this) if (this.hasOwnProperty(i))
				result.setVal(i, this[i].val);
			return result;
		};
		ModSet.prototype.hasMod   = function (s) {
			return this.hasOwnProperty(s) && this[s].val !== this[s]._mType.defVal;
		};
		ModSet.prototype.setVal   = function (s, v) {this[s] = new Modifier(s,v);};
		ModSet.prototype.getVal   = function (s) {
			if (this.hasOwnProperty(s))
				return this[s].val;
			else if (MOD_LIB.hasOwnProperty(s))
				return MOD_LIB[s].defVal;
		};
		ModSet.prototype.stackVal = function (s, v) {
			if (this.hasOwnProperty(s))
				this[s].setStack(v);
			else {
				this.setVal(s);
				this[s].setStack(v);
			}
			return this;
		};
		ModSet.prototype.getStack = function (mods) {
			var result = this.clone();
			result.setStack(mods);
			return result;
		};
		ModSet.prototype.setStack = function (mods) {
			if (mods)
				for (var i in mods) if (mods.hasMod(i))
					this.stackVal(i, mods[i].val);
			return this;
		};
		ModSet.prototype.print    = function (b) {
			// Prints a list of modifiers
			// Expects: Boolean (optional), Returns: String
			var s = "";
			for (var i in this) if (this.hasMod(i))
				s += this[i].print() + ((b)? "\n" : " ");
			return s;
		};

		return function (o) {return new ModSet(o);};

	})();

	result.createModSet = createModSet;

	// Ship part data

	(function () {

		var ISTAT = [];

		// Ship Part Classes

		var Item = (function () {

			function Part (a) {
				var i;
				if (a) {
					i = a.length;
					this.id      = a[0];
					this.imgLoc  = a[1];
					this.code    = a[2];
					this.name    = a[3];
					this.tag     = a[4];
					this.tech    = a[5];
					this.sMods   = createModSet(a[i - 4]);
					this.weight  = a[i - 3];
					this.costs   = createResCost(a[i - 2]);
					this.unlock  = a[i - 1];
				}
			}
			Part.prototype.createItemIcon = function (id) {return new ItemIcon(this.x, this,id);};
			Part.prototype.getWeight      = function (yL, mods) {
				var mWt = 1;
				if (mods) {
					switch (this.x) {
						case 1: mWt = mods.getVal("wtWpn"); break;
						case 2: mWt = mods.getVal("wtAmr"); break;
						case 4: mWt = mods.getVal("wtTct"); break;
					}
				}
				return (
					window.Math.floor(
						this.weight * (
							(yL === 1 && this.tech === 0)? 0.85 : 1
						)
					) * mWt
				);
			};

			function Hull (a) { // Constructor: hulls
				Part.call(this, a);
				this.type     = a[6];
				this.slots    = [1, a[11].length, a[8], a[9], a[10]];
				this.wSlots   = a[11];
				this.slots.wt = a[7];
				this.slots.wu = a[7][1] > 0 || a[7][2] > 0;
				this.refit    = a[12];
				this.armor    = a[13];
				this.cargo    = a[14];
				this.sonarRng = a[15];
				this.mSpeed   = a[16];
				this.cSpeed   = a[17];
				this.tSpeed   = a[18];
				this.evade    = a[19];
				this.repMod   = a[20];
			}
			Hull.prototype   = Object.create(Part.prototype);
			Hull.prototype.x = 0;
			Hull.prototype.hasWSlotType   = function (n) {return this.wSlots.indexOf(n) != -1;};
			Hull.prototype.isValidWeapon  = function (s, weap) {
				var wT  = weap.wType,
					wST = this.wSlots[s];
				return !(
					(wST !== 1 && wST !==2 && wT === kWT.TORP) ||
					(wST === 2 && wT  !== kWT.TORP) ||
					(wST !== 3 && wT  === kWT.UAVS)
				);
			};

			function Weap (a) { // Constructor: weapons
				Part.call(this, a);
				this.wType  = a[6];
				this.dType  = a[7];
				this.minRng = a[8];
				this.maxRng = a[9];
				this.dmg    = a[10];
				this.reload = a[11];
				this.salvo  = a[12];
				this.accur  = a[13];
				this.splash = a[14];
				this.spread = a[15];
				this.pMods  = createModSet(a[16]);
			}
			Weap.prototype   = Object.create(Part.prototype);
			Weap.prototype.x = 1;
			Weap.prototype.getWTypeName     = function () {
				switch (this.wType) {
					case kWT.NONE : return "None";         break;
					case kWT.CANN : return "Cannon";       break;
					case kWT.MISS : return "Missile";      break;
					case kWT.MORT : return "Mortar";       break;
					case kWT.RCKT : return "Rockets";      break;
					case kWT.TORP : return "Torpedoes";    break;
					case kWT.DPCH : return "Depth Charge"; break;
					case kWT.DEFS : return "Defensive";    break;
					case kWT.LNCH : return "Launcher";     break;
					case kWT.UAVS : return "UAV";          break;
					default       : return "UNRECOGNIZED WEAPON TYPE:\xA0" + this.wType;
				}
			};
			Weap.prototype.getDTypeName     = function () {
				switch (this.dType) {
					case kDT.NON  : return "None";         break;
					case kDT.BAL  : return "Ballistic";    break;
					case kDT.PEN  : return "Penetrating";  break;
					case kDT.EXP  : return "Explosive";    break;
					case kDT.CNC  : return "Concussive";   break;
					case kDT.RAD  : return "Radioactive";  break;
					case kDT.APEN : return "Anti-Missile"; break;
					case kDT.AMRT : return "Anti-Mortar";  break;
					default       : return "UNRECOGNIZED DAMAGE TYPE:\xA0" + this.dType;
				}
			};
			Weap.prototype.isTypeMatchWD    = function (wT, dT) {
				return (
					(dT === kDT.NON) ||
					(dT === kDT.BAL && wT === kWT.CANN) ||
					(dT === kDT.PEN && wT === kWT.MISS) ||
					(dT === kDT.EXP && (wT === kWT.MORT || wT === kWT.RCKT)) ||
					((dT === kDT.AMRT || dT === kDT.APEN) && wT === kWT.DEFS) ||
					(dT === kDT.CNC && (wT === kWT.TORP || wT === kWT.DPCH)) ||
					(dT === kDT.RAD && wT === kWT.LNCH)
				);
			};
			Weap.prototype.isTypeMatchDW    = function (dT, wT) {
				/*return (
					(dT===kDT.NON) ||
					(dT===kDT.BAL && wT===kWT.CANN) ||
					(dT===kDT.PEN && wT===kWT.MISS) ||
					(dT===kDT.EXP && (wT===kWT.MORT || wT===kWT.RCKT)) ||
					((dT===kDT.AMRT || dT===kDT.APEN) && wT===kWT.DEFS) ||
					(dT===kDT.CNC && (wT===kWT.TORP || wT===kWT.DPCH)) ||
					(dT===kDT.RAD && wT===kWT.LNCH)
				);*/
			};
			Weap.prototype.getAccFromSplSpr = function (sMods) {
				var mSpl = (sMods)? sMods.getVal("spl") : 1,
					mSpr = (sMods)? sMods.getVal("spr") : 1;
				return (1 / 4)+(window.Math.pow(this.splash * mSpl, 2) / window.Math.pow(this.spread * mSpr, 2));
			};
			Weap.prototype.getDmg           = function (dT0, dT1, sMods) {
				var d   = this.dmg,
					wd  = (!dT1 || dT1 === this.dType)? d : 0,
					bd  = 0,
					mT0 = 1, // buildings, walls, ships
					mT1 = 1, // weapon specific
					mT2 = 1; // submerged
				if (!dT1)   dT1   = kDT.NON;
				if (!sMods) sMods = createModSet();
				switch (dT0) {
					case kDT.BLDG:
						mT0 = this.pMods.getVal("dmBldg") * sMods.getVal("dmBldg");
						break;
					case kDT.WALL:
						mT0 = this.pMods.getVal("dmWall") * sMods.getVal("dmWall");
						break;
					case kDT.SBMG:
						mT2 = this.pMods.getVal("dmSbmg") * sMods.getVal("dmSbmg");
						if (mT2 === 1) mT2 = 0;
						break;
				}
				switch (dT1) {
					case kDT.NON:
						bd += d * this.pMods.getVal("bDmB");
						bd += d * this.pMods.getVal("bDmP");
						bd += d * this.pMods.getVal("bDmE");
						bd += d * this.pMods.getVal("bDmC");
						bd += d * this.pMods.getVal("bDmU");
						break;
					case kDT.BAL : bd += d * this.pMods.getVal("bDmB"); break;
					case kDT.PEN : bd += d * this.pMods.getVal("bDmP"); break;
					case kDT.EXP : bd += d * this.pMods.getVal("bDmE"); break;
					case kDT.CNC : bd += d * this.pMods.getVal("bDmC"); break;
					case kDT.RAD : bd += d * this.pMods.getVal("bDmU"); break;
				}
				switch (this.wType) {
					case kWT.CANN :
						//mT1 *= sMods.getVal("dmB"); break;
					case kWT.MISS :
						mT1 *= sMods.getVal("dmP"); break;
					case kWT.MORT :
						//mT1 *= sMods.getVal("dmM"); break;
					case kWT.RCKT :
						//mT1 *= sMods.getVal("dmR"); break;
					case kWT.MORT :
					case kWT.RCKT :
						//mT1 *= sMods.getVal("dmE"); break;
					case kWT.TORP :
					case kWT.DPCH :
						mT1 *= sMods.getVal("dmC"); break;
				}
				mT1 *= sMods.getVal("dmN");
				return (wd * mT0 * mT1 + bd) * mT2;
			};
			Weap.prototype.getDPS           = function (dT0, dT1, mods) {
				var d = this.getDmg(dT0, dT1, mods),
					a = this.accur,
					r = this.reload,
					s = this.salvo,
					rr = 0.1,
					mA = 1, mR = 1, mS = 0;
				///if (!mods) mods = createModSet();
				if (mods) {
					var am, dm, rm, sm;
					switch (this.wType) {
						case kWT.CANN:
							am = "acB"; dm = "dmB"; rm = "rlB"; sm = "svB";
							break;
						case kWT.MISS:
							am = "acP"; dm = "dmP"; rm = "rlP"; sm = "svP";
							break;
						case kWT.MORT:
							am = "acE"; dm = "dmE"; rm = "rlE"; sm = "svE";
							break;
						case kWT.RCKT:
							//rm = "rlR";
							am = "acE"; dm = "dmE"; rm = "rlR"; sm = "svE";
							break;
						case kWT.TORP:
						case kWT.DPCH:
							am = "acC"; dm = "dmC"; rm = "rlC"; sm = "svC";
							break;
						case kWT.LNCH:
							am = "acU"; dm = "dmU"; rm = "rlU"; sm = "svU";
							break;
					}
					mA = mods.getVal(am) || 1;
					mR = mods.getVal(rm) || 1;
					mS = mods.getVal(sm) || 0;
					mA *= mods.getVal("acN");
					mR *= mods.getVal("rlN");
					//mD*=1-mods.dmN;
					//mR*=1-mods.rlN;
					//mS+=mods.svN;
					if (this.wType === kWT.MORT || this.wType === kWT.RCKT) mA = 1;
				}
				if (window.isNaN(a)) a = this.getAccFromSplSpr(mods);
				a *= mA;
				if (a > 1) a = 1;
				// Note: Benjamin Becker suggests subtracting 1 from salvo
				return (a * d) / (r / mR + rr * (s + mS - 1));
			};
			Weap.prototype.getCPS           = function (mods) {
				var a = this.accur,
					r = this.reload,
					s = this.salvo,
					mA = 1, mR = 1, mS = 0,
					am, rm, sm;
				if (mods) {
					switch (this.dType) {
						case kDT.AMRT:
							am = "acAM"; rm = "rlAM"; sm = "svAM";
							break;
						case kDT.APEN:
							am = "acAP"; rm = "rlAP"; sm = "svAP";
							break;
					}
					mA = mods.getVal(am) || 1;
					mR = mods.getVal(rm) || 1;
					mS = mods.getVal(sm) || 0;
					mA *= mods.getVal("acN");
					mR *= mods.getVal("rlN");
				}
				return a * mA * s / (r / mR);
			};
			Weap.prototype.getDPW           = function (dT0, dT1, sMods, yL) {
				if (!sMods) sMods = createModSet();
				return this.getDPS(dT0, dT1, sMods) / this.getWeight(yL, sMods);
			};
			Weap.prototype.getModMaxRng     = function (sMods) {
				var mRg = 1;
				if (!sMods) sMods = createModSet();
				switch (this.dType) {
					case kDT.AMRT: mRg = sMods.getVal("rgAM"); break;
					case kDT.APEN: mRg = sMods.getVal("rgAP"); break;
					case kDT.RAD : mRg = sMods.getVal("rgU");  break;
				}
				switch (this.wType) {
					case kWT.CANN: mRg = sMods.getVal("rgB");  break;
					case kWT.MISS: mRg = sMods.getVal("rgP");  break;
					case kWT.RCKT: mRg = sMods.getVal("rgR");  break;
				}
				mRg *= sMods.getVal("rgN");
				return this.maxRng * mRg;
			};
			Weap.prototype.isInRange        = function (n,sMods) {
				if (sMods) return n >= this.minRng && n <= this.getModMaxRng(sMods);
				else       return n >= this.minRng && n <= this.maxRng;
			};

			function Armr (a) { // Constructor: armor
				Part.call(this, a);
				this.armor  = a[6];
				this.apw    = this.armor / this.weight;
			}
			Armr.prototype   = Object.create(Part.prototype);
			Armr.prototype.x = 2;

			function Spec (a) { // Constructor: specials
				Part.call(this, a);
			}
			Spec.prototype   = Object.create(Part.prototype);
			Spec.prototype.x = 3;

			function Tact (a) { // Constructor: tactical modules
				Part.call(this, a);
				this.type   = a[6];
				this.range  = a[7];
				this.armor  = a[8];
				this.foe    = createModSet(a[9]);
			}
			Tact.prototype   = Object.create(Part.prototype);
			Tact.prototype.x = 4;
			Tact.prototype.getTypeName    = function () {
				switch (this.type) {
					case 0 : return "None";
					case 1 : return "Friendly";
					case 2 : return "Hostile";
				}
			};

			function ItemIcon (x, item, s) {
				var newDiv = document.createElement("div");
				if (s) newDiv.id = s;
				newDiv.classList.add("item-icon");
				switch (x) {
					case 0 : newDiv.classList.add("hull"); break;
					case 1 : newDiv.classList.add("weap"); break;
					case 2 : newDiv.classList.add("armr"); break;
					case 3 : newDiv.classList.add("spec"); break;
					case 4 : newDiv.classList.add("tact"); break;
				}
				this._x   = x;
				this.elem = newDiv;
				this.setItemImg(item);
			}
			ItemIcon.prototype.setItemImg = function (item, big) {
				var size;
				if (big) {size = 100; this.elem.classList.add("big");}
				else     {size = 60;  this.elem.classList.remove("big");}
				this.elem.title = item.name;
				if (item.id === 0) this.elem.classList.add("hidden");
				else{
					if (this.elem.firstChild)
						this.elem.removeChild(this.elem.firstChild);
					if (typeof item.code === "string")
						this.elem.appendChild(document.createTextNode(item.code));
					this.elem.classList.remove("hidden");
					this.elem.style.backgroundPosition =
						(-1 * size * item.imgLoc[1]) + "px " +
						(-1 * size * item.imgLoc[0]) + "px";
				}
			};

			return (function () {
				var I = [Hull, Weap, Armr, Spec, Tact];
				Hull = null; Weap = null; Armr = null; Spec = null; Tact = null;
				return I;
			})();

		})();

		// Init Ship Part Data

		(function () {

			var itemData = [
					[
						[   0,"NH"   ,0,"No Ship"                 ,"--"     ,0,0,[0,0,0] ,0,0,0,[                   ],false,   0,      0, 0, 0, 0, 0,1   ,1   ,                                         ,    0,[     0,       0,       0,       0,       0],[0,0 ,  0,       0,       0,       0,       0,      0]],

						[1000,[ 0, 0],0,"Gunboat"                 ,"Gb"     ,0,0,[0,1,0] ,1,0,0,[1                  ],false,  10,    656, 0,50,22,60,0.67,0.25,                                         ,   31,[    30,     365,     159,     122,      99],[0,0 ,"r",       0,       0,       0,       0,      0]],
						[1001,[ 0, 1],0,"Skirmisher"              ,"Skirm"  ,0,0,[0,1,0] ,1,0,0,[1                  ],false,  27,   1968, 0,43,20,48,0.75,0.25,                                         ,   82,[   120,    1399,     839,     699,     525],[0,1 ,"r",    7693,    6154,    5770,    6923,    360]],
						[1002,[ 0, 2],0,"Longship"                ,"Long"   ,0,0,[0,2,0] ,2,1,0,[1,1                ],false,  72,   7871, 0,37,16,36,0.8 ,0.5 ,                                         ,  216,[   300,    7382,    4429,    3691,    2768],[0,2 ,"r",   40602,   32482,   30451,   36542,   1980]],
						[1003,[ 0, 3],0,"Marauder"                ,"Mar"    ,0,0,[3,0,0] ,2,1,0,[0,0,0              ],false, 190,  31482, 0,32,14,21,0.9 ,0.5 ,                                         ,  570,[  9000,   38964,   23378,   19482,   14611],[0,4 ,"r",  214301,  171441,  160726,  192871,  20220]],
						[1004,[ 0, 4],0,"Battle Barge"            ,"BB"     ,0,0,[4,0,0] ,2,2,0,[0,0,0,0            ],true , 466, 113335, 0,27,12,15,1.2 ,0.75,                                         , 1397,[ 27000,  181228,  108737,   90614,   67960],[0,6 ,"r",  996753,  797402,  747565,  897078, 101220]],
						[1005,[ 0, 5],0,"Leviathan"               ,"Levi"   ,0,0,[5,0,0] ,3,2,0,[0,0,0,0,0          ],true ,1074, 374006, 0,23,10,10,1.4 ,0.75,                                         , 3222,[ 54000,  759349,  455610,  379675,  284756],[0,8 ,"r", 4176421, 3341137, 3135316, 3758779, 506220]],
						[1006,[ 0, 6],0,"Floating Fortress"       ,"FF"     ,0,2,[6,0,0] ,3,2,0,[0,0,3,0,0,3        ],true ,2317,1122018, 0,20, 8, 6,1.5 ,0.75,                                         , 6951,[108000, 1837835, 1702701, 1418917, 1064188],[0,10,"r",15608090,12486472,11706068,14047281,1012500]],
						[1007,[ 0, 7],0,"Hammerhead"              ,"HH"     ,0,0,[6,0,0] ,3,2,0,[0,0,0,0,0,0        ],true ,2400,1000000, 0,23,10, 6,1.4 ,0.75,                                         , 7500,[108000, 2800000, 1680000, 1400000, 1750000],[0,10,"r",22400000,17920000,16800000,20160000,1731360]],
						[1014,[ 1, 4],0,"Battle Barge A"          ,"BB-A"   ,0,0,[4,0,0] ,2,2,0,[0,0,0,0            ],true , 535, 225000, 0,30,13,17,1.1 ,0.75,                                         , 1397,[ 27000,  181228,  108737,   90614,   67960],[]],
						[1015,[ 1, 5],0,"Leviathan A"             ,"Levi-A" ,0,0,[5,0,0] ,3,2,0,[0,0,0,0,0          ],true ,1289, 450000, 0,26,11,11,1.3 ,0.75,                                         , 3222,[ 54000,  759349,  455610,  379675,  284756],[]],
						[1016,[ 1, 6],0,"Floating Fortress A"     ,"FF-A"   ,0,2,[6,0,0] ,3,2,0,[0,0,3,0,0,3        ],true ,2549,1122018, 0,20, 8, 8,1.4 ,0.75,                                         , 6951,[108000, 2837835, 1702701, 1418918, 1064188],[]],
						[1017,[ 1, 7],0,"Hammerhead Hull A"       ,"HH-A"   ,0,0,[6,0,0] ,3,2,0,[0,0,0,0,0,0        ],true ,3400,1000000, 0,23,10,10,1.2 ,1   ,                                         , 7538,[108000, 2800000, 1600000, 1400000, 1750000],[2,"Revenge Raid I"   ,"Sector Prize"  ]],
						[1026,[ 2, 6],0,"Super Fortress"          ,"SF"     ,0,2,[6,0,0] ,4,2,0,[0,0,3,0,0,3        ],true ,2850,1872018, 0,20, 8,10,1.25,1   ,                                         , 7388,[144000, 5250000, 3937500, 3150000, 6300000],[0,0 ,  0,       0,       0,       0,       0,      0]],
						[1027,[ 2, 7],0,"Hammerhead Hull B"       ,"HH-B"   ,0,0,[6,0,0] ,3,2,0,[0,0,0,0,0,0        ],true ,3000,1000000, 0,25,11,15,1.2 ,1   ,                                         , 7538,[108000, 2800000, 1600000, 1400000, 1750000],[2,"Revenge Raid II"  ,"Sector Prize"  ]],

						[1100,[ 0, 8],0,"Sea Wolf"                ,"SW"     ,0,0,[5,0,0] ,1,3,0,[0,0,0,0,0          ],true , 550, 195000, 0,30,14,20,1   ,1   ,                                         , 2300,[ 81000, 1744526, 1046716,  872263,  654197],[0,9 ,"r", 9594896, 7675917, 7196172, 8635406, 759360]],
						[1101,[ 0, 9],0,"Sea Scorpion"            ,"SS"     ,0,0,[7,0,0] ,1,3,0,[0,0,0,0,0,0,0      ],true , 750, 395000, 0,27,12,13,1.3 ,1   ,                                         , 4500,[108000, 3500000, 2100000, 1750000, 2187500],[0,"Unavailable"      ]],
						[1111,[ 1, 9],0,"Sea Scorpion A"          ,"SS-A"   ,0,0,[7,0,0] ,1,3,0,[0,0,0,0,0,0,0      ],true ,1000, 400000, 0,27,12,17,1.2 ,1   ,                                         , 4500,[151920, 3500000, 2100000, 1750000, 2187500],[2,"Base Invaders II" ,"Top Four Prize"]],

						[1200,[ 0,10],0,"Rampart"                 ,"Rmprt"  ,0,0,[7,0,0] ,5,2,0,[0,0,0,0,0,0,0      ],true ,4500,  55000, 0, 7, 4, 5,1.4 ,0.5 ,{"rgB":1.4}                              , 7400,[ 88803, 1173333, 2346667, 1760000, 1760000],[]],
						[1201,[ 0,11],0,"Goliath"                 ,"Glth"   ,0,0,[7,0,0] ,7,2,0,[0,0,0,0,0,0,0      ],true ,9001,  75000, 0, 7, 4, 5,1.4 ,0.5 ,{"rgB":1.4,"acN":1.33}                   ,14800,[518400,18750000,15000000,15000000,18750000],[2,"Base Invaders IV" ,"Quota Prize 5" ]],

						[1300,[ 0,12],0,"Triton"                  ,"Tri"    ,0,2,[10,0,0],5,3,0,[0,0,0,0,0,0,3,3,3,3],true ,5850,1272018, 0,20, 9, 9,1.25,1   ,{"dfP":0.5,"dmBldg":1.75,"rgAM":1.7}                             ,14905,[518400,27781250,26392188,26392188,22433359],[2,"Drac Hunt"        ,"Quota Prize 5" ]],
						[1310,[ 1,12],0,"Harlock's Triton"        ,"H's Tri",0,2,[10,0,0],5,3,0,[0,0,0,0,0,0,3,3,3,3],true ,5850,3272018, 0,20,10,10,1.1 ,1   ,{"dfB":0.8,"dfP":0.5,"dfE":0.8,"dmBldg":2,"rgAM":1.8,"rgAP":1.45},14905,[518400,27781250,26392188,26392188,22433359],[]],

						[1400,[ 0,16],0,"Predator Submarine"      ,"Pred"   ,0,1,[0,0,2] ,1,1,0,[2,2                ],true , 120,   2500, 0,27,12,25,1   ,3   ,{"vsr":30,"tSrf":10,"tClk":28}           ,  416,[ 18000,  205652,  123391,  120826,   77120],[0,5 ,"r",  642903,  514323,  411458,  822916,  50580]],
						[1401,[ 1,16],0,"Stalker Submarine"       ,"Stalk"  ,0,1,[0,2,2] ,2,2,0,[1,1,2,2            ],true , 250,  10000,50,20, 9,20,1.3 ,2   ,{"vsr":45,"tSrf":14,"tClk":28}           , 2200,[108000, 1182816,  709689,  591408,  443556],[0,9 ,"r", 6505487, 5204389, 4879115, 5854938, 699960]],
						[1402,[ 2,16],0,"Barracuda"               ,"Brcda"  ,0,1,[0,6,0] ,1,3,0,[1,1,1,1,1,1        ],true , 600,  15000, 0,30,14,17,1.2 ,4   ,{"vsr":35,"tSrf":10,"tClk":28}           , 1970,[259200, 3125000, 2500000, 2500000, 4687500],[2,"Base Invaders III","Quota Prize 5" ]],
						[1403,[ 3,16],0,"Spectre"                 ,"Spec"   ,0,1,[0,0,6] ,3,2,0,[2,2,2,2,2,2        ],true ,1200,  45000, 0,20,10,20,0.2 ,4   ,{"vsr":50,"tSrf":10,"tClk":60}           , 4800,[108000, 4200000, 3150000, 2520000, 5040000],[2,"Storm Strike"     ,"Quota Prize 5" ]],

						[1500,[ 0,15],0,"Arbiter"                 ,"Arbi"   ,0,0,[0,1,0] ,2,2,1,[1                  ],true , 562, 145000, 0,30,12,15,0.9 ,0.75,                                         ,12000,[ 36000,  475923,  285554,  237962,  297452],[0,0 ,  0,       0,       0,       0,       0,      0]],
						[1501,[ 1,15],0,"Hurricane"               ,"Hrrcn"  ,0,0,[0,2,0] ,2,3,1,[1,1                ],true ,1289, 450000, 0,25,11, 9,0.85,1   ,{"xDrn":2}                               ,13200,[388800,15875000, 9525000, 7937500, 5953125],[]],
						[1502,[ 3,15],0,"Vanguard"                ,"Vngrd"  ,0,0,[10,0,0],5,3,1,[0,0,0,0,0,0,0,0,0,0],true ,3980,1162058, 0,10, 9,13,1.25,1   ,{"dfB":0.6,"dmBldg":2,"wtTct":-0.4}      ,15260,[518400,100359766,95341777,95341777,81040511],[]],

						[1055,[ 3, 5],0,"Mercury"                 ,"Mrcry"  ,0,0,[4,2,0] ,3,3,0,[0,0,0,0,1,1        ],true ,2665, 650000,40,25,12,18,1   ,1,  ,{"dfP":0.7,"rlP":1.19,"ret":true}          , 6420,[108000, 7875000, 5906250, 4095000, 8190000],[]],
						[1056,[ 3, 6],0,"Vindicator"              ,"Vndctr" ,0,0,[7,0,0] ,3,3,0,[0,0,0,0,0,0,0      ],true ,1755, 867412, 0,32,14,18,0.9 ,1   ,{"dfE":0.65,"dfU":0.65,"rlB":1.39,"rgB":1.1,"slwRst":0.39},5825,[518400,47250000,35437500,24570000,49140000],[]],
						[1057,[ 3, 7],0,"Mauler"                  ,"Maul"   ,0,0,[6,0,0] ,4,3,0,[0,0,0,0,0,0        ],true ,4700,1200000, 0,23,10,15,1.2 ,1   ,{"dfB":0.6,"rlP":1.19,"rlM":1.19}          , 7538,[     0,       0,       0,       0,       0],[]],
						[1150,[ 3, 9],0,"Sawfish"                 ,"Swfsh"  ,0,0,[6,0,0] ,2,3,0,[0,0,0,0,0,0        ],true ,1205, 621425, 0,35,16,18,1   ,1   ,{"rgB":1.1}                                , 4860,[237600, 9450000, 7087500, 4914000, 9828000],[]],
						[1151,[ 3, 8],0,"Stingray"                ,"Stng"   ,0,0,[7,0,0] ,2,4,0,[0,0,0,0,0,0,0      ],true ,1493, 721425, 0,35,16,20,0.8 ,1   ,{"rgB":1.1,"acB":1.4}                      , 4950,[518400, 7875000, 5906250, 4095000, 8190000],[]],
						[1161,[ 4, 8],0,"Zoe's Stingray"         ,"Z's Stng",0,0,[7,0,0] ,2,4,0,[0,0,0,0,0,0,0      ],true ,1493, 937853, 0,35,16,24,0.7 ,1   ,{"rgB":1.2,"rlB":1.4,"acB":1.4}            , 5250,[518400,14175000,10631250, 7371000,14742000],[]],
						[1250,[ 3,11],0,"Thresher"                ,"Thrsh"  ,0,0,[6,0,0] ,5,3,0,[0,0,0,0,0,0        ],true ,3920,1081010, 0,22,11,14,1.15,1   ,{"dfE":0.5,"spl":1.35,"rgR":1.1,"rlR":1.6} ,12125,[383904,23614063,22433359,22433359,19068355],[]],
						[1350,[ 3,12],0,"Mako"                    ,"Mako"   ,0,0,[6,0,0] ,3,3,0,[0,0,0,0,0,0        ],true ,3280, 981010, 0,22,12,14,1.2 ,1,  ,{"dfE":0.6,"spl":1.19,"rgR":1.1,"rlR":1.3} , 9750,[426560,20071953,19068355,19068355,16208102],[]],

						[1600,[ 0,13],0,"Lightning Carrier"       ,"LghtCrr",0,2,[7,0,0] ,2,4,0,[0,0,3,3,3,3,3      ],true ,1493, 721425, 0,32,14,19,1   ,1   ,{"dfP":0.6,"rlB":1.30,"rgB":1.1 ,"dmUAV":1.19}, 6200,[     0,       0,       0,       0,       0],[]],
						[1610,[ 1,13],0,"Nash's Lightning Carrier","N's Crr",0,2,[7,0,0] ,2,4,0,[0,0,3,3,3,3,3      ],true ,1493,1721425, 0,32,14,29,0.8 ,1   ,{"dfP":0.6,"rlB":1.60,"rgB":1.19,"dmUAV":1.39}, 6200,[     0,       0,       0,       0,       0],[]],
						[1601,[ 0,14],0,"Atlas Carrier"           ,"AtlsCrr",0,2,[8,0,0] ,4,3,0,[3,3,3,3,3,3,3,3    ],true ,6095,1324652, 0,25,11,14,1   ,1   ,{"dfP":0.5,"dfU":0.8 ,"dmUAV":1.30}           , 6095,[474800,20071953,19068355,19068355,16208102],[]],
						[1611,[ 1,14],0,"Harlock's Atlas Carrier" ,"H's Crr",0,2,[8,0,0] ,4,3,0,[3,3,3,3,3,3,3,3    ],true ,6095,3254652, 0,25,11,14,0.9 ,1   ,{"dfP":0.5,"dfE":0.7 ,"dfU":0.6,"dmUAV":1.6 } ,14245,[     0,       0,       0,       0,       0],[]],

						[2000,[ 5, 0],0,"Corvette"                ,"Crvtt"  ,1,0,[1,0,0] ,1,1,0,[1                  ],false,  14,    300, 0,40,22,30,0.6 ,1   ,{"dfB":0.6,"dfP":0.8,"dfE":0.6}           ,   36,[   600,    2500,    2000,    2000,    5000],[2,"Storm Strike"     ,"Quota Prize 1" ]],
						[2001,[ 5, 1],0,"Frigate"                 ,"Frgt"   ,1,0,[1,0,0] ,1,1,0,[1                  ],false,  40,   1050, 0,33,20,23,0.67,1   ,{"dfB":0.6,"dfP":0.8,"dfE":0.6}           ,  100,[  2400,   12500,   10000,   10000,   25000],[2,"Storm Part III"   ,"Quota Prize 1" ]],
						[2002,[ 5, 2],0,"Destroyer"               ,"Des"    ,1,0,[1,1,0] ,3,1,0,[0,1                ],true , 164,  26923, 0,34,15,20,0.7 ,0.75,{"dfB":0.8,"dfP":0.8,"dfE":0.8}           ,  431,[  9600,   28500,   15500,   15500,   25500],[2,"Base Invaders VI" ,"Quota Prize 1" ]],
						[2003,[ 5, 3],0,"Light Cruiser"           ,"LC"     ,1,0,[3,0,1] ,2,1,0,[0,0,0,2            ],true , 342,  98642, 0,25,13,15,0.8 ,0.75,{"dfB":0.8,"dfP":0.8,"dfE":0.8}           , 1042,[ 28800,  160000,   69000,   69000,  155000],[2,"Base Invaders VI" ,"Quota Prize 2" ]],
						[2004,[ 5, 4],0,"Battlecruiser"           ,"BC"     ,1,0,[0,4,0] ,3,3,0,[1,1,1,1            ],true , 815,  45019,50,22,12,20,0.9 ,1   ,{"dfB":0.6,"dfP":0.8,"dfE":0.8}           , 2040,[ 86400, 1562500, 1250000, 1250000, 3125000],[2,"Revenge Raid III" ,"Sector Prize"  ]],
						[2005,[ 5, 5],0,"Battleship"              ,"BS"     ,1,0,[6,0,0] ,4,3,0,[0,0,0,0,0,0        ],true ,2100, 157567, 0,19, 9,15,1   ,1   ,{"dfB":0.7,"dfP":0.7,"dfE":0.8,"rgB":1.1} , 6265,[259200, 4687500, 3750000, 3750000, 9375000],[2,"Revenge Raid IV"  ,"Sector Prize"  ]],
						[2006,[ 5, 6],0,"Dreadnought"             ,"Dn"     ,1,0,[8,0,0] ,4,4,0,[0,0,0,0,0,0,0,0    ],true ,5200, 551480, 0,14, 8,10,1.2 ,1   ,{"dfB":0.8,"dfP":0.8,"dfE":0.8}           ,13020,[518400,14062500,11250000,11250000,28125000],[2,"Base Invaders I"  ,"Top Four Prize"]],
						[2007,[ 5, 7],0,"Strike Cruiser"          ,"StrkC"  ,1,0,[6,0,0] ,4,3,0,[0,0,0,0,0,0        ],true ,1630, 882368, 0,25,11,12,1.1 ,1   ,{"dfB":0.8 ,"dfP":0.8,"dfE":0.6 ,"spl":1.25,"spr":0.7 }          , 6945,[388800, 7031250, 5625000, 5625000,14062500],[2,"Base Invaders V"  ,"Quota Prize 5" ]],
						[2012,[ 6, 2],0,"Destroyer X"             ,"Des-X"  ,1,0,[1,1,0] ,3,1,0,[0,1                ],true , 142,  26923, 0,37,17,25,0.7 ,0.75,{"dfB":0.8,"dfP":0.8,"dfE":0.8}                                  ,  431,[  7476,   28500,   15500,   15500,   25500],[2,"Base Invaders VI" ,"Quota Prize 1" ]],
						[2013,[ 6, 3],0,"Light Cruiser X"         ,"LC-X"   ,1,0,[3,0,1] ,2,1,0,[0,0,0,2            ],true , 320,  98642, 0,34,16,20,0.8 ,0.75,{"dfB":0.8,"dfP":0.8,"dfE":0.8,"rlP":1.19}                       , 1042,[ 25920,  160000,   69000,   69000,  115000],[2,"Base Invaders VI" ,"Quota Prize 2" ]],
						[2014,[ 6, 4],0,"Battlecruiser X"         ,"BC-X"   ,1,0,[0,4,0] ,3,3,0,[1,1,1,1            ],true , 765,  45019,40,27,14,20,0.9 ,1   ,{"dfB":0.7,"dfP":0.8,"dfE":0.8,"rgB":1.1}                        , 3040,[ 86400, 1562500, 1250000, 1250000, 3125000],[2,"Revenge Raid III" ,"Sector Prize"  ]],
						[2016,[ 6, 6],0,"Dreadnought X"           ,"Dn-X"   ,1,0,[8,0,0] ,4,4,0,[0,0,0,0,0,0,0,0    ],true ,4100, 551483, 0,18, 9,12,1.2 ,1   ,{"dfB":0.8,"dfP":0.8,"dfE":0.8,"spl":1.25 ,"spr":0.7 ,"rlM":1.65},13020,[518400,14062500,11250000,11250000,28125000],[2,"Storm Warning"    ,"Quota Prize 5" ]],
						[2017,[ 6, 7],0,"Strike Cruiser-X"        ,"StrkC-X",1,0,[6,0,0] ,4,3,0,[0,0,0,0,0,0        ],true ,4516,1014247, 0,26,12,15,1   ,1   ,{"dfB":0.7 ,"dfP":0.8,"dfE":0.6 ,"rgB":1.19,"rlB":1.65}          , 8334,[388800, 7031250, 5625000, 5625000,14062500],[]],
						[2022,[ 7, 2],0,"Destroyer ECM"           ,"Des-ECM",1,0,[1,1,0] ,3,1,0,[0,1                ],true , 192,  26923,60,37,17,25,0.6 ,0.75,{"dfB":0.7,"dfP":0.7,"dfE":0.7,"dfC":0.9}                        ,  622,[  9600,   28500,   15500,   15500,   25500],[]],
						[2026,[ 7, 6],0,"Spader's DNX"            ,"S's DnX",1,0,[8,0,0] ,4,4,0,[0,0,0,0,0,0,0,0    ],true ,4100,1075853, 0,25,11,18,1   ,1   ,{"dfB":0.8,"dfP":0.6,"dfE":0.6,"dfU":0.6,"spl":1.3  ,"spr":0.7 ,"rlM":2.1 },13020,[518400,14062500,11250000,11250000,28125000],[]],

						[2100,[ 5, 8],0,"Missile Cruiser"         ,"MC"     ,1,0,[6,0,0] ,4,3,0,[0,0,0,0,0,0        ],true ,1520, 827224, 0,22,10,10,1.1 ,1   ,{"dfB":0.8,"dfP":0.6,"dfE":0.8,"rlP":1.4}                        , 7246,[388800, 7031250, 5625000, 5625000,14062500],[0,0 ,  0,       0,       0,       0,       0,      0]],
						[2110,[ 6, 8],0,"Missile Cruiser X"       ,"MC-X"   ,1,0,[6,0,0] ,4,3,0,[0,0,0,0,0,0        ],true ,2965, 951308, 0,25,11,15,1   ,1   ,{"dfB":0.8,"dfP":0.6,"dfE":0.8,"rlP":1.65,"fev":0.7,"ret":true}  , 8695,[466560, 8437500, 6750000, 6750000,16875000],[0,0 ,  0,       0,       0,       0,       0,      0]],
						[2101,[ 5, 9],0,"Interdictor"             ,"Int"    ,1,0,[0,4,3] ,2,3,0,[1,1,1,1,2,2,2      ],true ,1865, 167412,25,32,14,15,1   ,1   ,{"dfB":0.9,"dfP":0.9,"dfE":0.9,"dfC":0.7}                        , 5245,[388800, 6093750, 4875000, 4875000,12187500],[2,"Base Invaders VI" ,"Quota Prize 5" ]],
						[2121,[ 7, 9],0,"Vassago's Interdictor"   ,"V's Int",1,0,[0,4,3] ,2,3,0,[1,1,1,1,2,2,2      ],true ,1865, 757428,65,32,14,20,0.8 ,1   ,{"dfB":0.7,"dfP":0.7,"dfE":0.9,"dfC":0.6,"dmC":1.4}              , 5245,[388800, 6093750, 4875000, 4875000,12187500],[]],

						[2200,[ 5,10],0,"Juggernaut"              ,"Jugg"   ,1,0,[4,0,0] ,8,3,0,[0,0,0,0            ],true ,3389, 937521, 0,16, 8,14,1.25,1   ,{"dfB":0.65,"dfP":0.8,"dfE":0.75,"rgB":1.1,"rlB":1.33}                         , 9140,[427680, 7734375, 6187500, 6187500,15468750],[]],
						[2210,[ 6,10],0,"Juggernaut-X"            ,"Jugg-X" ,1,0,[5,0,0] ,8,3,0,[0,0,0,0,0          ],true ,3835,1031273, 0,21, 9,15,1   ,1   ,{"dfB":0.65,"dfP":0.8,"dfE":0.75,"rgB":1.1,"rlB":1.33,"slwRst":0.19,"aAmr":0.5},10120,[427680, 7734375, 6187500, 6187500,15468750],[]],
						[2201,[ 5,11],0,"Guardian"                ,"Grd"    ,1,0,[0,0,0] ,6,3,0,[0,0,0,0,0,0,0,0,0  ],true ,6549, 251118, 0, 5, 3, 7,1.3 ,1   ,{"dfB":0.8,"dfP":0.6,"dfE":0.7,"rlM":1.65,"spl":1.25,"spr":0.7}                ,13824,[570240,21093750,16875000,16875000,28125000],[]],

						[2300,[ 5,12],0,"Proto-Nemesis"           ,"PrtNem" ,1,0,[0,0,0] ,5,5,0,[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],true ,48826,7998945,50,16, 9,10,1.3 ,1  ,{"dfB":0.3,"dfP":0.5,"dfE":0.4,"rgR":1.1,"rlP":2.2,"rlR":2.7,"spl":1.4},27550,[1771200,126562500,101250000,101250000,168750000],[]],

						[2400,[ 5,16],0,"Reaper"                  ,"Reap"   ,1,1,[0,7,0] ,4,3,0,[1,1,1,1,1,1,1      ],true ,2250, 665208, 0,22,13,18,1.2 ,1   ,{"tSrf":15,"tClk":35,"acN":1.1,"dfB":0.8,"dfP":0.8,"dfE":0.8,"dfSbmg":0.75,"dmBdlg":1.25},6865,[448600,39701211,29281500,37100543,41255422],[]],

						[2600,[ 5,13],0,"Nuclear Cruiser"              ,"Ncl"    ,1,0,[0,0,0] ,4,3,0,[0,0,0,0,0,0,0,0        ],true ,4548, 893592, 0,25,11,15,1   ,1   ,{"dfB":0.8,"dfP":0.8,"dfE":0.8,"dfU":0.7,"rlU":1.5}                    , 8295,[0,0,0,0,0],[]],
						[2620,[ 6,13],0,"High-Lander's Nuclear Cruiser","H's Ncl",1,0,[0,0,0] ,4,3,0,[0,0,0,0,0,0,0,0        ],true ,5844,1742305, 0,25,11,14,0.9 ,1   ,{"dfB":0.7,"dfP":0.7,"dfE":0.7,"dfU":0.6,"rlU":1.8}                    , 9015,[0,0,0,0,0],[]],
						[2601,[ 5,14],0,"Enforcer"                     ,"Enf"    ,1,0,[0,0,0] ,5,4,0,[0,0,0,0,0,0,0,0,0,0,0,0],true ,5648, 893592, 0, 5, 3, 4,1   ,0.5 ,{"dfB":0.8,"dfP":0.65,"dfE":0.5,"dfU":0.5,"rgU":1.1,"rlU":2,"acN":1.35},13125,[483200,31640625,25312500,25312500,42187500],[]],

						[3006,[ 8, 6],0,"Berserker"               ,"Bsk"    ,2,0,[0,0,0] ,6,4,0,[0,0,0,0,0,0,0,0,0  ],true ,4242,3926764, 0,20,11,13,1   ,1   ,{"dfB":0.7,"dfP":0.6,"dfE":0.8,"dfU":0.8,"dmBldg":1.7}, 9075,[999733,19156010,16282609,18198210,17240409],[]],
						[3016,[ 9, 6],0,"Grimshine's Berserker"   ,"GrimBsk",2,0,[0,0,0] ,6,4,0,[0,0,0,0,0,0,0,0,0  ],true ,6286,4813420, 0,20,11,13,1   ,1   ,{"dfB":0.6,"dfP":0.5,"dfE":0.7,"dfU":0.7,"dmBldg":2  },10151,[999733,19156010,16282609,18198210,17240409],[]],
						[3007,[ 8, 7],0,"Hellstrike"              ,"Hell"   ,2,0,[0,0,0] ,6,4,0,[0,0,0,0,0,0,0      ],true ,5550,3926764, 0,30,12,12,1   ,1   ,{"dfB":0.8,"dfP":0.7,"dfE":0.5,"rgR":1.1,"rlR":2.4,"spl":1.39,"wev":0.66,"slwRst":0.25,"tctRst":0.5},12292,[639840,81255422,73129880,78817759,75567542],[]]

					],
					[
						// id,img    ,code ,name                       ,tag      ,t,wType   ,dType   ,rg,rg,dmg ,rel ,sv,acc ,spl,spr,pMods                      ,sMods         ,wt  ,costs                                       ,unlock
						[   0,"NI"   ,0    ,"No Weapon"                ,"None"   ,0,kWT.NONE,kDT.NON , 0, 0,   0,1   , 1,0   ,"-","-",                           ,              ,   0,[     0,       0,       0,       0,       0],[0, 0,0,0,0,0,0,0]],  //[0,LabLVL,O,M,E,Z,T]

						[1100,[ 0, 0],"I"  ,"Thud Cannon I"            ,"Thud-1" ,0,kWT.CANN,kDT.BAL , 0,49,  14,2   , 1,1   ,"-","-",{"dmBldg":1.75}            ,              ,   4,[     5,     719,     575,     575,     503],[0, 0,0,0,0,0,0,0]],
						[1101,[ 0, 1],"II" ,"Thud Cannon II"           ,"Thud-2" ,0,kWT.CANN,kDT.BAL , 0,49,  30,2.5 , 1,0.9 ,"-","-",{"dmBldg":1.75}            ,              ,   9,[    20,    1797,    1150,    1150,     880],[0, 0,0,0,0,0,0,0]],
						[1102,[ 0, 2],"III","Thud Cannon III"          ,"Thud-3" ,0,kWT.CANN,kDT.BAL , 0,49,  68,3   , 1,0.8 ,"-","-",{"dmBldg":1.75}            ,              ,  24,[   300,    4492,    2300,    2300,    1541],[0, 0,0,0,0,0,0,0]],
						[1103,[ 0, 3],"IV" ,"Thud Cannon IV"           ,"Thud-4" ,0,kWT.CANN,kDT.BAL , 0,49, 150,3.5 , 1,0.7 ,"-","-",{"dmBldg":1.75}            ,              ,  62,[   600,   11230,    4600,    4600,    2696],[0, 0,0,0,0,0,0,0]],
						[1110,[ 0, 4],"I"  ,"Ripper Cannon I"          ,"Rip-1"  ,0,kWT.CANN,kDT.BAL , 0,43, 122,1.5 , 3,0.9 ,"-","-",{"dmBldg":1.75}            ,              ,  18,[   860,   10417,    8333,    8333,    7292],[0, 0,0,0,0,0,0,0]],
						[1111,[ 0, 5],"II" ,"Ripper Cannon II"         ,"Rip-2"  ,0,kWT.CANN,kDT.BAL , 0,43, 144,1.5 , 3,0.8 ,"-","-",{"dmBldg":1.75}            ,              ,  43,[  2580,   52083,   33333,   33333,   25521],[0, 0,0,0,0,0,0,0]],
						[1112,[ 0, 6],"III","Ripper Cannon III"        ,"Rip-3"  ,0,kWT.CANN,kDT.BAL , 0,43, 184,1.5 , 3,0.7 ,"-","-",{"dmBldg":1.75}            ,              , 104,[  7740,  260417,  133333,  133333,   89323],[0, 0,0,0,0,0,0,0]],
						[1113,[ 0, 7],"IV" ,"Ripper Cannon IV"         ,"Rip-4"  ,0,kWT.CANN,kDT.BAL , 0,43, 234,1.5 , 3,0.6 ,"-","-",{"dmBldg":1.75}            ,              , 249,[ 18480, 1302083,  533333,  533333,  312630],[0, 0,0,0,0,0,0,0]],
						[1120,[ 0, 8],"I"  ,"Shredder Cannon I"        ,"Shred-1",0,kWT.CANN,kDT.BAL , 0,47, 266,1.6 , 4,0.4 ,"-","-",{"dmBldg":1.75}            ,              ,  96,[ 19320,  572055,  388421,  328754,  298564],[0, 0,0,0,0,0,0,0]],
						[1121,[ 0, 9],"II" ,"Shredder Cannon II"       ,"Shred-2",0,kWT.CANN,kDT.BAL , 0,47, 350,1.6 , 4,0.4 ,"-","-",{"dmBldg":1.75}            ,              , 152,[ 41880, 1097864,  701543,  687345,  600152],[0, 0,0,0,0,0,0,0]],
						[1122,[ 0,10],"III","Shredder Cannon III"      ,"Shred-3",0,kWT.CANN,kDT.BAL , 0,47, 492,1.6 , 4,0.4 ,"-","-",{"dmBldg":1.75}            ,              , 284,[ 66180, 1584055, 1158943, 1094678,  946222],[0, 0,0,0,0,0,0,0]],
						[1130,[ 0,11],"I"  ,"Crossbow I"               ,"CrsBw-1",0,kWT.CANN,kDT.BAL ,30,49, 490,11  , 1,0.7 ,"-","-",{"dmBldg":2,"bDmP":0.2,"dmWall":8,"stat":true,"rgPirc":52,"dcyPirc":0.6,"preF":0.3},  , 500,[0,0,0,0,0],[]],
						[1131,[ 0,12],"II" ,"Crossbow II"              ,"CrsBw-2",0,kWT.CANN,kDT.BAL ,30,49, 880,11  , 1,0.7 ,"-","-",{"dmBldg":2,"bDmP":0.2,"dmWall":8,"stat":true,"rgPirc":52,"dcyPirc":0.6,"preF":0.3},  , 800,[0,0,0,0,0],[]],
						[1132,[ 0,13],"III","Crossbow III"             ,"CrsBw-3",0,kWT.CANN,kDT.BAL ,30,49,1720,11  , 1,0.7 ,"-","-",{"dmBldg":2,"bDmP":0.2,"dmWall":8,"stat":true,"rgPirc":52,"dcyPirc":0.8,"preF":0.3},  ,1400,[0,0,0,0,0],[]],

						[2100,[ 7, 0],"N"  ,"Impact Cannon D30-N"      ,"D30-N"  ,1,kWT.CANN,kDT.BAL , 0,43, 194,3   , 1,1   ,"-","-",{"dmBldg":3               },              ,  80,[   900,   50000,   40000,   40000,  150000],[1, 0,1,4]],        //[1,IntelLab,Tier,BPS]
						[2101,[ 7, 0],"L"  ,"Impact Cannon D30-L"      ,"D30-L"  ,1,kWT.CANN,kDT.BAL , 0,45, 192,3   , 1,0.66,"-","-",{"dmBldg":3               },              ,  80,[   900,   50000,   40000,   40000,  150000],[1, 0,1,5]],
						[2102,[ 7, 0],"A"  ,"Impact Cannon D30-A"      ,"D30-A"  ,1,kWT.CANN,kDT.BAL , 0,45, 136,3   , 1,1   ,"-","-",{"dmBldg":3               },              ,  80,[   900,   50000,   40000,   40000,  150000],[1, 0,2,5]],
						[2103,[ 7, 1],"R"  ,"Impact Cannon D30-R"      ,"D30-R"  ,1,kWT.CANN,kDT.BAL , 0,48, 238,3   , 1,0.5 ,"-","-",{"dmBldg":3               },{"arm":50  ,"dfB":0.03,"dfP":0.03,"dfE":0.03}, 100,[ 15360,  560119,  448160,  448160,  784279],[]],
						[2110,[ 7, 2],"X"  ,"Assault Cannon D33-X"     ,"D33-X"  ,1,kWT.CANN,kDT.BAL , 0,45, 100,1.5 , 2,1   ,"-","-",{"dmBldg":1.5 ,"bDmE":0.25},{"arm":40  }  , 150,[ 35000,  950000,  760000,  760000, 1350000],[1, 0,1,6]],
						[2111,[ 7, 2],"P"  ,"Assault Cannon D33-P"     ,"D33-P"  ,1,kWT.CANN,kDT.BAL , 0,45, 100,1.5 , 2,1   ,"-","-",{"dmBldg":1.5 ,"bDmP":0.25},{"arm":40  }  , 150,[ 35000,  950000,  760000,  760000, 1350000],[1, 0,2,6]],
						[2112,[ 7, 2],"A"  ,"Assault Cannon D33-A"     ,"D33-A"  ,1,kWT.CANN,kDT.BAL , 0,45, 122,1.5 , 2,1   ,"-","-",{"dmBldg":1.5 ,           },{"arm":80  }  , 150,[ 35000,  950000,  760000,  760000, 1350000],[1, 0,2,7]],
						[2113,[ 7, 3],"Z"  ,"Assault Cannon D33-Z"     ,"D33-Z"  ,1,kWT.CANN,kDT.BAL , 0,45, 150,1.5 , 2,1   ,"-","-",{"dmBldg":1.5 ,"bDmE":0.25},{"arm":100 }  , 200,[ 75000, 1750000, 1400000, 1400000, 2625000],[]],
						[2120,[ 7, 4],"L"  ,"Siege Cannon D35-L"       ,"D35-L"  ,1,kWT.CANN,kDT.BAL , 0,45, 580,4.5 , 1,0.4 ,"-","-",{"dmBldg":2.25,"bDmE":0.5 }              ,{"csp":1.05}  , 350,[102780, 1900000, 1520000, 1520000, 3800000],[1, 8,3,8]],
						[2121,[ 7, 4],"S"  ,"Siege Cannon D35-S"       ,"D35-S"  ,1,kWT.CANN,kDT.BAL , 0,43, 300,4.5 , 1,0.4 ,  4,"-",{"dmBldg":2.25,"bDmE":0.5 }              ,{"csp":1.05}  , 350,[102780, 1900000, 1520000, 1520000, 3800000],[1, 8,2,8]],
						[2122,[ 7, 4],"X"  ,"Siege Cannon D35-X"       ,"D35-X"  ,1,kWT.CANN,kDT.BAL , 0,43, 688,4.5 , 1,0.4 ,"-","-",{"dmBldg":2.25,"bDmE":0.5 }              ,{"csp":1.05}  , 350,[102780, 1900000, 1520000, 1520000, 3800000],[1, 0,3,0]],
						[2123,[ 7, 4],"W"  ,"Siege Cannon D35-W"       ,"D35-W"  ,1,kWT.CANN,kDT.BAL , 0,43, 250,4.5 , 1,0.4 ,  6,"-",{"dmBldg":2   ,"dmWall":6   ,"bDmE":0.5 },{"csp":1.05}  , 350,[102780, 1881000, 1504800, 1504800, 3762000],[]],
						[2124,[ 7, 4],"Z"  ,"Siege Cannon D35-Z"       ,"D35-Z"  ,1,kWT.CANN,kDT.BAL , 0,43, 350,4.5 , 1,0.4 ,  4,"-",{"dmBldg":2.75,"bDmE":0.5               },{"csp":1.05}  , 350,[159600, 2090000, 1672000, 1672000, 4180000],[]],
						[2130,[ 7, 6],"D"  ,"Assault Disruptor D33-D"  ,"D33-D"  ,1,kWT.CANN,kDT.BAL , 0,42, 100,1.5 , 2,1   ,"-","-",{"dmBldg":1.5 ,"slw":0.05,"slwMax":0.75} ,{"arm":50  }  , 150,[123180, 4488964, 3232054, 3052496, 7182342],[]],

						[3100,[ 7, 8],"I"  ,"Reaver Chaingun I"        ,"Chain-1",2,kWT.CANN,kDT.BAL , 0,47,1572,12.5,30,0.7 ,"-","-",{"bDmU":0.35}              ,              , 198,[0, 4575440, 4118796, 4439147, 4256089],[]],
						[3101,[ 7, 9],"II" ,"Reaver Chaingun II"       ,"Chain-2",2,kWT.CANN,kDT.BAL , 0,47,2620,12.5,30,0.7 ,"-","-",{"bDmU":0.35}              ,              , 396,[0, 8782912, 7904621, 8519425, 8168108],[]],
						[3102,[ 7,10],"III","Reaver Chaingun III"      ,"Chain-3",2,kWT.CANN,kDT.BAL , 0,47,4134,12.5,30,0.7 ,"-","-",{"bDmU":0.35}              ,              , 594,[0,12672440,11405196,12292267,11785369],[]],

						[1200,[ 1, 0],"I"  ,"Rapier Missiles I"        ,"Rap-1"  ,0,kWT.MISS,kDT.PEN ,30,65,  24,3   , 1,1   ,"-","-",               ,                          ,  30,[    51,    2200,    1760,    1760,    1540],[0, 0,0,0,0,0,0,0]],
						[1201,[ 1, 1],"II" ,"Rapier Missiles II"       ,"Rap-2"  ,0,kWT.MISS,kDT.PEN ,30,65,  60,4   , 1,0.8 ,"-","-",               ,                          ,  69,[   202,   11000,    7040,    7040,    5390],[0, 0,0,0,0,0,0,0]],
						[1202,[ 1, 2],"III","Rapier Missiles III"      ,"Rap-3"  ,0,kWT.MISS,kDT.PEN ,30,65, 120,5   , 1,0.66,"-","-",               ,                          , 159,[   606,   55000,   28160,   28160,   18865],[0, 0,0,0,0,0,0,0]],
						[1203,[ 1, 3],"IV" ,"Rapier Missiles IV"       ,"Rap-4"  ,0,kWT.MISS,kDT.PEN ,30,65, 238,6   , 1,0.5 ,"-","-",               ,                          , 365,[  1818,  275000,  112640,  112640,   66028],[0, 0,0,0,0,0,0,0]],
						[1210,[ 1, 4],"I"  ,"Cutlass Missiles I"       ,"Cut-1"  ,0,kWT.MISS,kDT.PEN ,35,74,  92,5   , 1,0.8 ,"-","-",               ,                          ,  70,[  1244,   44075,   28667,   36857,   56438],[0, 0,0,0,0,0,0,0]],
						[1211,[ 1, 5],"II" ,"Cutlass Missiles II"      ,"Cut-2"  ,0,kWT.MISS,kDT.PEN ,35,74, 146,6   , 1,0.7 ,"-","-",               ,                          , 161,[  3311,  180708,  114667,  147429,  197531],[0, 0,0,0,0,0,0,0]],
						[1212,[ 1, 6],"III","Cutlass Missiles III"     ,"Cut-3"  ,0,kWT.MISS,kDT.PEN ,35,74, 206,7   , 1,0.66,"-","-",               ,                          , 370,[  8677,  740901,  458667,  589714,  691359],[0, 0,0,0,0,0,0,0]],
						[1213,[ 1, 7],"IV" ,"Cutlass Missiles IV"      ,"Cut-4"  ,0,kWT.MISS,kDT.PEN ,35,74, 668,8   , 1,0.5 ,"-","-",               ,                          , 852,[ 42950, 3037693, 1834667, 2358857, 2419758],[0, 0,0,0,0,0,0,0]],
						[1220,[ 1, 8],"I"  ,"Downpour Missiles I"      ,"DwnPr-1",0,kWT.MISS,kDT.PEN ,24,65,  86,5   , 1,0.6 ,"-","-",{"dmBldg":2   ,"fev":0.66,"preF":0.75},   , 175,[  5940, 1500000, 1200000, 1200000, 2250000],[]],
						[1221,[ 1, 9],"II" ,"Downpour Missiles II"     ,"DwnPr-2",0,kWT.MISS,kDT.PEN ,24,65, 118,5   , 1,0.6 ,"-","-",{"dmBldg":2   ,"fev":0.66,"preF":0.75},   , 350,[ 16320, 3000000, 2400000, 2400000, 4500000],[]],
						[1222,[ 1,10],"III","Downpour Missiles III"    ,"DwnPr-3",0,kWT.MISS,kDT.PEN ,24,65, 236,5   , 1,0.6 ,"-","-",{"dmBldg":2   ,"fev":0.66,"preF":0.75},   , 700,[ 65280, 6000000, 4800000, 4800000, 9000000],[]],

						[2200,[ 8, 0],"N"  ,"Strike Missile D51-N"     ,"D51-N"  ,1,kWT.MISS,kDT.PEN , 0,65, 140,3   , 1,0.9 ,"-","-",{"dmBldg":2   },                          , 120,[  4000,  125000,  100000,  100000,  375000],[1, 0,1,4]],
						[2201,[ 8, 0],"L"  ,"Strike Missile D51-L"     ,"D51-L"  ,1,kWT.MISS,kDT.PEN , 0,68, 176,3   , 1,0.6 ,"-","-",{"dmBldg":2   },                          , 120,[  4000,  125000,  100000,  100000,  375000],[1, 0,1,4]],
						[2202,[ 8, 0],"A"  ,"Strike Missile D51-A"     ,"D51-A"  ,1,kWT.MISS,kDT.PEN , 0,68, 118,3   , 1,0.9 ,"-","-",{"dmBldg":2   },                          , 120,[  4000,  125000,  100000,  100000,  375000],[1, 0,1,5]],
						[2210,[ 8, 2],"C"  ,"Assault Missile D53-C"    ,"D53-C"  ,1,kWT.MISS,kDT.PEN , 0,74, 150,4   , 2,0.75,"-","-",{"bDmB":0.25}  ,                          , 600,[ 95000, 2000000, 1600000, 1600000, 3000000],[1, 0,2,6]],
						[2211,[ 8, 2],"M"  ,"Assault Missile D53-M"    ,"D53-M"  ,1,kWT.MISS,kDT.PEN , 0,74, 150,4   , 2,0.75,"-","-",{"bDmB":0.25}  ,                          , 600,[ 95000, 2000000, 1600000, 1600000, 3000000],[1, 0,2,6]],
						[2212,[ 8, 2],"R"  ,"Assault Missile D53-R"    ,"D53-R"  ,1,kWT.MISS,kDT.PEN , 0,74, 150,4   , 2,0.75,"-","-",{"bDmB":0.25}  ,                          , 600,[ 95000, 2000000, 1600000, 1600000, 3000000],[1, 0,2,7]],
						[2220,[ 8, 4],"E"  ,"Siege Missile D55-E"      ,"D55-E"  ,1,kWT.MISS,kDT.PEN , 0,68, 590,5   , 1,0.5 ,"-","-",{"dmBldg":2   },{"arm":150,"tsp":1.1 }    ,1200,[142200, 3000000, 2400000, 2400000, 6000000],[1, 9,3,7]],
						[2221,[ 8, 4],"V"  ,"Siege Missile D55-V"      ,"D55-V"  ,1,kWT.MISS,kDT.PEN , 0,68, 590,5   , 1,0.5 ,"-","-",{"dmBldg":2   },{"arm":150,"csp":1.05}    ,1200,[142200, 3000000, 2400000, 2400000, 6000000],[1, 9,3,8]],
						[2222,[ 8, 4],"A"  ,"Siege Missile D55-A"      ,"D55-A"  ,1,kWT.MISS,kDT.PEN , 0,68, 590,5   , 1,0.5 ,"-","-",{"dmBldg":2   },{"arm":250}               ,1200,[142200, 3000000, 2400000, 2400000, 6000000],[1,10,3,0]],
						[2223,[ 8, 5],"F"  ,"Siege Missile D55-F"      ,"D55-F"  ,1,kWT.MISS,kDT.PEN , 0,68, 450,5   , 1,0.6 ,"-","-",{"dmBldg":2,"bDmE":0.33,"fev":0.75},{"arm":150},1200,[142200, 3000000, 2400000, 2400000, 6000000],[]],

						[3200,[ 8, 8],"I"  ,"Torrent Missile I"        ,"Trrnt-1",2,kWT.MISS,kDT.PEN , 0,62, 764,12.5,16,0.9 ,"-","-",{"bDmU":0.35},                            , 198,[0,0,0,0,0],[]],
						[3201,[ 8, 9],"II" ,"Torrent Missile II"       ,"Trrnt-2",2,kWT.MISS,kDT.PEN , 0,62,1270,12.5,16,0.9 ,"-","-",{"bDmU":0.35},                            , 396,[0,0,0,0,0],[]],
						[3202,[ 8,10],"III","Torrent Missile III"      ,"Trrnt-3",2,kWT.MISS,kDT.PEN , 0,62,1914,12.5,16,0.9 ,"-","-",{"bDmU":0.35},                            , 594,[0,0,0,0,0],[]],

						[1300,[ 2, 0],"I"  ,"Diplomat Mortar I"        ,"Dip-1"  ,0,kWT.MORT,kDT.EXP ,40,85, 100,6   , 1,"-" , 10, 80,                           ,                      , 105,[   420,    3792,    3033,    3033,    2654],[0, 0,0,0,0,0,0,0]],
						[1301,[ 2, 1],"II" ,"Diplomat Mortar II"       ,"Dip-2"  ,0,kWT.MORT,kDT.EXP ,40,85, 156,6   , 1,"-" , 10, 80,                           ,                      , 179,[  1260,   18958,   12133,   12133,    9290],[0, 0,0,0,0,0,0,0]],
						[1302,[ 2, 2],"III","Diplomat Mortar III"      ,"Dip-3"  ,0,kWT.MORT,kDT.EXP ,40,85, 240,6   , 1,"-" , 10, 80,                           ,                      , 303,[  1260,   94792,   48533,   48533,   32514],[0, 0,0,0,0,0,0,0]],
						[1303,[ 2, 3],"IV" ,"Diplomat Mortar IV"       ,"Dip-4"  ,0,kWT.MORT,kDT.EXP ,40,85, 304,6   , 1,"-" , 10, 80,                           ,                      , 516,[  2820,  473958,  194133,  194133,  113797],[0, 0,0,0,0,0,0,0]],
						[1310,[ 2, 4],"I"  ,"Peacemaker Mortar I"      ,"PM-1"   ,0,kWT.MORT,kDT.EXP ,50,87, 344,7   , 1,"-" , 12, 90,                           ,                      , 235,[  3500,   75300,   73208,   72163,   71117],[0, 0,0,0,0,0,0,0]],
						[1311,[ 2, 5],"II" ,"Peacemaker Mortar II"     ,"PM-2"   ,0,kWT.MORT,kDT.EXP ,50,87, 412,7   , 1,"-" , 12, 90,                           ,                      , 423,[ 10500,  271080,  256229,  248961,  241797],[0, 0,0,0,0,0,0,0]],
						[1312,[ 2, 6],"III","Peacemaker Mortar III"    ,"PM-3"   ,0,kWT.MORT,kDT.EXP ,50,87, 666,7   , 1,"-" , 12, 90,                           ,                      , 761,[ 26250,  975888,  896802,  858914,  822109],[0, 0,0,0,0,0,0,0]],
						[1313,[ 2, 7],"IV" ,"Peacemaker Mortar IV"     ,"PM-4"   ,0,kWT.MORT,kDT.EXP ,50,87,1374,7   , 1,"-" , 12, 90,                           ,                      ,1371,[ 65625, 3513197, 3138807, 2963254, 2795169],[0, 0,0,0,0,0,0,0]],
						[1320,[ 2, 8],"I"  ,"Negotiator Mortar I"      ,"Neg-1"  ,0,kWT.MORT,kDT.EXP ,40,89, 216,5   , 1,"-" , 13,100,{"dmBldg":1.75}            ,                      , 156,[  2520,  350000,  280000,  280000, 1050000],[0, 0,0,0,0,0,0,0]],
						[1321,[ 2, 9],"II" ,"Negotiator Mortar II"     ,"Neg-2"  ,0,kWT.MORT,kDT.EXP ,40,89, 436,5   , 1,"-" , 13,100,{"dmBldg":1.75}            ,                      , 312,[ 10740, 3000000, 2400000, 2400000, 4500000],[0, 0,0,0,0,0,0,0]],
						[1322,[ 2,10],"III","Negotiator Mortar III"    ,"Neg-3"  ,0,kWT.MORT,kDT.EXP ,40,89, 876,5   , 1,"-" , 13,100,{"dmBldg":1.75}            ,                      , 624,[ 40980, 7500000, 6000000, 6000000,11250000],[0, 0,0,0,0,0,0,0]],

						[2300,[ 9, 0],"N"  ,"Shockwave Mortar D71-N"   ,"D71-N"  ,1,kWT.MORT,kDT.EXP ,40,82, 720,7   , 1,"-" , 10, 80,{"dmBldg":1.25}            ,                      , 350,[  7500,  200000,  160000,  160000,  600000],[0, 0,0,0]],
						[2301,[ 9, 0],"L"  ,"Shockwave Mortar D71-L"   ,"D71-L"  ,1,kWT.MORT,kDT.EXP ,40,85, 820,7   , 1,"-" ,  8,100,{"dmBldg":1.25}            ,                      , 350,[  7500,  200000,  160000,  160000,  600000],[0, 0,0,0]],
						[2302,[ 9, 0],"A"  ,"Shockwave Mortar D71-A"   ,"D71-A"  ,1,kWT.MORT,kDT.EXP ,40,85, 526,7   , 1,"-" , 10, 80,{"dmBldg":1.25}            ,                      , 350,[  7500,  200000,  160000,  160000,  600000],[0, 0,0,0]],
						[2303,[ 9, 0],"Q"  ,"Shockwave Mortar D71-Q"   ,"D71-Q"  ,1,kWT.MORT,kDT.EXP ,40,85, 880,6.5 , 2,"-" ,  8,100,{"dmBldg":1.25}            ,{"arm":100}           , 350,[ 11280,  300000,  240000,  240000,  900000],[]],
						[2310,[ 9, 2],"C"  ,"Assault Mortar D73-C"     ,"D73-C"  ,1,kWT.MORT,kDT.EXP ,50,89,1200,6   , 1,"-" , 10, 60,{"dmBldg":0.5 ,"bDmB":0.25},                      ,1200,[105000, 3000000, 2400000, 2400000, 4500000],[0, 0,0,0]],
						[2311,[ 9, 2],"M"  ,"Assault Mortar D73-M"     ,"D73-M"  ,1,kWT.MORT,kDT.EXP ,50,89,1200,6   , 1,"-" , 10, 60,{"dmBldg":0.5 ,"bDmP":0.25},                      ,1200,[105000, 3000000, 2400000, 2400000, 4500000],[0, 0,0,0]],
						[2312,[ 9, 2],"R"  ,"Assault Mortar D73-R"     ,"D73-R"  ,1,kWT.MORT,kDT.EXP ,50,89,1200,6   , 1,"-" , 10, 60,{"dmBldg":0.5 ,"bDmE":0.25},                      ,1200,[105000, 3000000, 2400000, 2400000, 4500000],[0, 0,0,0]],
						[2313,[ 9, 3],"X"  ,"Assault Mortar D73-X"     ,"D73-X"  ,1,kWT.MORT,kDT.EXP ,50,89,1500,6   , 1,"-" , 10, 60,{"dmBldg":0.5 ,"bDmE":0.3 },                      ,1200,[125760, 3200000, 2560000, 2560000, 4800000],[]],
						[2320,[ 9, 4],"V"  ,"Siege Mortar D75-V"       ,"D75-V"  ,1,kWT.MORT,kDT.EXP ,50,85,2040,7   , 1,"-" , 12,120,{"dmBldg":2   }            ,{"arm":200 ,"csp":1.1},1800,[157500, 4200000, 3360000, 3360000, 8400000],[0, 0,0,0]],
						[2321,[ 9, 4],"D"  ,"Siege Mortar D75-D"       ,"D75-D"  ,1,kWT.MORT,kDT.EXP ,50,85,2100,7   , 1,"-" , 12,120,{"dmBldg":2   }            ,{"arm":400 }          ,1800,[157500, 4200000, 3360000, 3360000, 8400000],[0, 0,0,0]],
						[2322,[ 9, 4],"S"  ,"Siege Mortar D75-S"       ,"D75-S"  ,1,kWT.MORT,kDT.EXP ,60,85,1200,7   , 1,"-" , 18,100,{"dmBldg":2   }            ,{"arm":150 }          ,1800,[157500, 4200000, 3360000, 3360000, 8400000],[0, 0,0,0]],
						[2323,[ 9, 4],"B"  ,"Siege Mortar D75-B"       ,"D75-B"  ,1,kWT.MORT,kDT.EXP ,60,85,1600,7   , 1,"-" , 18,100,{"dmBldg":2   }            ,{"arm":1200,"dfB":0.9},1800,[167500, 5200000, 4160000, 4160000,10400000],[]],

						[3300,[ 9, 8],null ,"Chaos Mortar"             ,"Chaos"  ,2,kWT.MORT,kDT.EXP ,30,82, 616,7   , 3,"-" , 14,110,{"dmBldg":1.3 ,"bDmB":1   ,"bDmP":1   ,"bDmE":1},  ,1300,[0,0,0,0,0],[]],

						[1400,[ 3, 0],"I"  ,"Hydra Rockets I"          ,"Hydra-1",0,kWT.RCKT,kDT.EXP , 0,57, 200,6   , 3,"-" ,  8, 80,                           ,  ,  51,[  1100,   15417,   12333,   12333,   10792],[0, 0,0,0,0,0,0,0]],
						[1401,[ 3, 1],"II" ,"Hydra Rockets II"         ,"Hydra-2",0,kWT.RCKT,kDT.EXP , 0,57, 440,6.5 , 4,"-" ,  8, 80,                           ,  ,  83,[  3300,   77083,   49333,   49333,   37771],[0, 0,0,0,0,0,0,0]],
						[1402,[ 3, 2],"III","Hydra Rockets III"        ,"Hydra-3",0,kWT.RCKT,kDT.EXP , 0,57, 720,7   , 5,"-" ,  8, 80,                           ,  , 120,[  9900,  385417,  197333,  197333,  132198],[0, 0,0,0,0,0,0,0]],
						[1403,[ 3, 3],"IV" ,"Hydra Rockets IV"         ,"Hydra-4",0,kWT.RCKT,kDT.EXP , 0,57,1040,7.5 , 6,"-" ,  8, 80,                           ,  , 182,[ 29700, 1927083,  789333,  789333,  462693],[0, 0,0,0,0,0,0,0]],
						[1410,[ 3, 4],"I"  ,"Maelstrom Rockets I"      ,"Maels-1",0,kWT.RCKT,kDT.EXP , 0,62, 850,7   , 3,"-" , 10,100,                           ,  ,  82,[  3300,  127500,  123250,  123250,  119000],[0, 0,0,0,0,0,0,0]],
						[1411,[ 3, 5],"II" ,"Maelstrom Rockets II"     ,"Maels-2",0,kWT.RCKT,kDT.EXP , 0,62,1070,7.25, 4,"-" , 10,100,                           ,  , 172,[  9900,  382500,  357425,  357425,  333200],[0, 0,0,0,0,0,0,0]],
						[1412,[ 3, 6],"III","Maelstrom Rockets III"    ,"Maels-3",0,kWT.RCKT,kDT.EXP , 0,62,1310,7.5 , 5,"-" , 10,100,                           ,  , 362,[ 34950, 1147500, 1036533, 1036533,  932960],[0, 0,0,0,0,0,0,0]],
						[1413,[ 3, 7],"IV" ,"Maelstrom Rockets IV"     ,"Maels-4",0,kWT.RCKT,kDT.EXP , 0,62,2856,8   , 6,"-" , 10,100,                           ,  , 759,[ 89100, 3442500, 3005944, 1805944, 2612288],[0, 0,0,0,0,0,0,0]],
						[1414,[ 3, 8],"V"  ,"Maelstrom Rockets V"      ,"Maels-5",0,kWT.RCKT,kDT.EXP , 0,62,1680,7.5 , 6,"-" , 12,100,                           ,  , 689,[ 63840, 4131000, 3607133, 3607133, 3134746],[0, 0,0,0,0,0,0,0]],

						[2400,[10, 0],"N"  ,"Firestorm Rockets D91-N"  ,"D91-N"  ,1,kWT.RCKT,kDT.EXP , 0,57, 172,1   , 1,"-" , 10,100,{"dmBldg":1.5             },  , 100,[  8460,  350000,  280000,  280000, 1050000],[0, 0,0,0]],
						[2401,[10, 0],"L"  ,"Firestorm Rockets D91-L"  ,"D91-L"  ,1,kWT.RCKT,kDT.EXP , 0,59, 204,1   , 1,"-" , 10,150,{"dmBldg":1.5             },  , 100,[  8460,  350000,  280000,  280000, 1050000],[0, 0,0,0]],
						[2402,[10, 0],"A"  ,"Firestorm Rockets D91-A"  ,"D91-A"  ,1,kWT.RCKT,kDT.EXP , 0,59, 144,1   , 1,"-" , 10,100,{"dmBldg":1.5             },  , 100,[  8460,  350000,  280000,  280000, 1050000],[0, 0,0,0]],
						[2403,[10, 0],"S"  ,"Firestorm Rockets D91-S"  ,"D91-S"  ,1,kWT.RCKT,kDT.EXP , 0,59, 156,1   , 1,"-" , 10, 65,{"dmBldg":1               },  , 200,[  8460,  350000,  280000,  280000, 1050000],[]],
						[2410,[10, 2],"C"  ,"Assault Rockets D93-C"    ,"D93-C"  ,1,kWT.RCKT,kDT.EXP , 0,62, 480,1   , 2,"-" , 10,100,{"dmBldg":0.5 ,"bDmB":0.25},  , 600,[ 94980, 3000000, 2400000, 2400000, 4500000],[0, 0,0,0]],
						[2411,[10, 2],"M"  ,"Assault Rockets D93-M"    ,"D93-M"  ,1,kWT.RCKT,kDT.EXP , 0,62, 480,1   , 2,"-" , 10,100,{"dmBldg":0.5 ,"bDmP":0.25},  , 600,[ 94980, 3000000, 2400000, 2400000, 4500000],[0, 0,0,0]],
						[2412,[10, 2],"R"  ,"Assault Rockets D93-R"    ,"D93-R"  ,1,kWT.RCKT,kDT.EXP , 0,62, 480,1   , 2,"-" , 10,100,{"dmBldg":0.5 ,"bDmE":0.25},  , 600,[ 94980, 3000000, 2400000, 2400000, 4500000],[0, 0,0,0]],
						[2413,[10, 2],"S"  ,"Assault Rockets D93-S"    ,"D93-S"  ,1,kWT.RCKT,kDT.EXP , 0,62, 180,0.75, 1,"-" , 12, 50,{"dmBldg":0.5 ,"bDmE":0.25},  ,1200,[ 94980, 3000000, 2400000, 2400000, 4500000],[]],
						[2420,[10, 4],"W"  ,"Siege Rockets D95-W"      ,"D95-W"  ,1,kWT.RCKT,kDT.EXP , 0,57,1580,1   , 3,"-" , 10,150,{"dmBldg":2   ,"wev":0.66} ,{"arm":400,"dfP":0.95}                      ,1300,[ 73800, 4200000, 3360000, 3360000, 8400000],[0,0 ,0,0]],
						[2421,[10, 4],"F"  ,"Siege Rockets D95-F"      ,"D95-F"  ,1,kWT.RCKT,kDT.EXP , 0,57,1580,1   , 3,"-" , 10,150,{"dmBldg":2   ,"fev":0.66} ,{"arm":400,"dfP":0.95}                      ,1300,[ 73800, 4200000, 3360000, 3360000, 8400000],[0,0 ,0,0]],
						[2422,[10, 4],"D"  ,"Siege Rockets D95-D"      ,"D95-D"  ,1,kWT.RCKT,kDT.EXP , 0,57,1580,1   , 3,"-" , 10,150,{"dmBldg":2              } ,{"arm":800,"dfB":0.95,"dfP":0.95,"dfE":0.95},1300,[ 73800, 4200000, 3360000, 3360000, 8400000],[0,0 ,0,0]],
						[2423,[10, 4],"S"  ,"Siege Rockets D95-S"      ,"D95-S"  ,1,kWT.RCKT,kDT.EXP , 0,57, 430,1   , 1,"-" , 16, 90,{"dmBldg":2              } ,{"arm":400,"dfB":0.95,"dfP":0.95,"dfE":0.95},2300,[ 73800, 4200000, 3360000, 3360000, 8400000],[]],

						[3400,[10, 8],null ,"Inferno Rockets"          ,"Infrno" ,2,kWT.RCKT,kDT.EXP , 0,59, 180,0.75, 1,"-" , 18, 60,{"dmBldg":1.4            } ,{"arm":400,"dfB":0.95,"dfP":0.95,"dfE":0.95},1442,[0,0,0,0,0],[]],

						[1500,[ 4, 0],"I"  ,"Havok Torpedoes I"        ,"Havok-1",0,kWT.TORP,kDT.CNC ,30,75,  60,7   , 1,0.8 ,"-","-",                                  ,            ,  20,[   420,    3792,    3033,    3033,    2654],[0, 0,0,0,0,0,0,0]],
						[1501,[ 4, 1],"II" ,"Havok Torpedoes II"       ,"Havok-2",0,kWT.TORP,kDT.CNC ,30,75, 120,7   , 1,0.8 ,"-","-",                                  ,            ,  40,[  1260,   18958,   12133,   12133,    9290],[0, 0,0,0,0,0,0,0]],
						[1502,[ 4, 2],"III","Havok Torpedoes III"      ,"Havok-3",0,kWT.TORP,kDT.CNC ,30,75, 182,7   , 1,0.8 ,"-","-",                                  ,            ,  80,[  3780,   94792,   48533,   48533,   32514],[0, 0,0,0,0,0,0,0]],
						[1503,[ 4, 3],"IV" ,"Havok Torpedoes IV"       ,"Havok-4",0,kWT.TORP,kDT.CNC ,30,75, 246,7   , 1,0.8 ,"-","-",                                  ,            , 160,[  5520,  473958,  194133,  194133,  113797],[0, 0,0,0,0,0,0,0]],
						[1520,[ 4, 8],"I"  ,"Poseidon Depth Charge I"  ,"Psdn-1" ,0,kWT.DPCH,kDT.CNC , 8,64, 172,7   , 4,"-" , 10,100,{"dmBldg":0.1,"bDmE":2,"dmSbmg":6},            , 150,[  1620,  350000,  280000,  280000, 1050000],[]],
						[1521,[ 4, 9],"II" ,"Poseidon Depth Charge II" ,"Psdn-2" ,0,kWT.DPCH,kDT.CNC , 8,64, 636,7   , 5,"-" , 12,100,{"dmBldg":0.1,"bDmE":2,"dmSbmg":6},            , 300,[ 21720, 3000000, 2400000, 2400000, 4500000],[]],
						[1522,[ 4, 9],"III","Poseidon Depth Charge III","Psdn-3" ,0,kWT.DPCH,kDT.CNC , 8,64,1364,7   , 6,"-" , 15,100,{"dmBldg":0.1,"bDmE":2,"dmSbmg":6},            , 600,[320000, 5880000, 4704000, 4704000,11760000],[]],
						[1530,[ 4,11],"I"  ,"Piranha Depth Charge I"   ,"Prnh-1" ,0,kWT.DPCH,kDT.CNC , 0,18,2592,6   , 4,"-" ,  4, 45,{"dmBldg":0.1,"bDmE":0,"dmSbmg":1},            , 311,[ 24660,  350000,  280000,  280000, 1050000],[]],
						[1531,[ 4,12],"II" ,"Piranha Depth Charge II"  ,"Prnh-2" ,0,kWT.DPCH,kDT.CNC , 0,18,5212,6   , 5,"-" ,  4, 45,{"dmBldg":0.1,"bDmE":0,"dmSbmg":1},            , 514,[ 50580, 3000000, 2400000, 2400000, 4500000],[]],
						[1532,[ 4,13],"III","Piranha Depth Charge III" ,"Prnh-3" ,0,kWT.DPCH,kDT.CNC , 0,18,7776,6   , 6,"-" ,  4, 45,{"dmBldg":0.1,"bDmE":0,"dmSbmg":1},            , 722,[ 79320, 8232000, 6585000, 6585000,16467000],[]],

						[2500,[11, 0],"T"  ,"Vortex Torpedoes D61-T"   ,"D61-T"  ,1,kWT.TORP,kDT.CNC ,24,75, 186,7   , 1,0.9 ,"-","-",                                  ,{"tsp":1.1 },  60,[  3660,  125000,  100000,  100000,  187500],[0, 0,0,0,0,0,0,0]],
						[2501,[11, 0],"M"  ,"Vortex Torpedoes D61-M"   ,"D61-M"  ,1,kWT.TORP,kDT.CNC ,24,75, 180,7   , 1,0.75,"-","-",{"bDmE":0.25}                     ,            ,  60,[  3660,  125000,  100000,  100000,  187500],[0, 0,0,0,0,0,0,0]],
						[2502,[11, 0],"A"  ,"Vortex Torpedoes D61-A"   ,"D61-A"  ,1,kWT.TORP,kDT.CNC ,24,75, 172,7   , 1,1   ,"-","-",                                  ,            ,  60,[  3660,  125000,  100000,  100000,  187500],[0, 0,0,0,0,0,0,0]],
						[2510,[11, 2],"R"  ,"Assault Torpedoes D63-R"  ,"D63-R"  ,1,kWT.TORP,kDT.CNC ,27,78, 296,6   , 1,0.75,"-","-",                                  ,            , 220,[ 24300,  625000,  500000,  500000,  937500],[]],
						[2511,[11, 2],"V"  ,"Assault Torpedoes D63-V"  ,"D63-V"  ,1,kWT.TORP,kDT.CNC ,27,75, 334,6   , 1,0.75,"-","-",                                  ,{"csp":1.05}, 220,[ 28560,  625000,  500000,  500000,  937500],[]],
						[2512,[11, 2],"X"  ,"Assault Torpedoes D63-X"  ,"D63-X"  ,1,kWT.TORP,kDT.CNC ,27,75, 284,6   , 1,0.75,"-","-",{"bDmE":0.25}                     ,            , 220,[ 24300, 7500000, 6000000, 6000000,11250000],[]],
						[2513,[11, 2],"B"  ,"Assault Torpedoes D63-B"  ,"D63-B"  ,1,kWT.TORP,kDT.CNC ,27,78, 420,6   , 1,0.75,"-","-",                                  ,{"csp":1.05}, 220,[ 35000, 7500000, 6000000, 6000000,11250000],[]],
						[2520,[11, 4],"D"  ,"Seige Torpedoes D65-D"    ,"D65-D"  ,1,kWT.TORP,kDT.CNC ,16,71, 504,5   , 1,0.6 ,"-","-",{"dmBldg":1.4,"bDmE":0.25}        ,{"arm":100 }, 400,[ 67500, 2500000, 2000000, 2000000, 3750000],[0, 0,0,0,0,0,0,0]],
						[2521,[11, 4],"C"  ,"Seige Torpedoes D65-C"    ,"D65-C"  ,1,kWT.TORP,kDT.CNC ,16,71, 504,5   , 1,0.6 ,"-","-",{"dmBldg":1.4,"bDmB":0.25}        ,{"arm":100 }, 400,[ 67500, 2500000, 2000000, 2000000, 3750000],[0, 0,0,0,0,0,0,0]],
						[2522,[11, 4],"S"  ,"Seige Torpedoes D65-S"    ,"D65-S"  ,1,kWT.TORP,kDT.CNC ,16,71, 602,5   , 1,0.6 ,"-","-",{"dmBldg":1.4,           }        ,{"arm":100 }, 400,[ 67500, 2500000, 2000000, 2000000, 3750000],[0, 0,0,0,0,0,0,0]],

						[1600,[ 5, 0],"I"  ,"Hellstorm Anti-Mortar I"  ,"Hell-1" ,0,kWT.DEFS,kDT.AMRT, 0,28,   0,5   , 2,0.2 ,"-","-",  ,            , 100,[  8500,  291667,  268333,  268333,  245000],[0, 0,0,0,0,0,0,0]],
						[1601,[ 5, 1],"II" ,"Hellstorm Anti-Mortar II" ,"Hell-2" ,0,kWT.DEFS,kDT.AMRT, 0,28,   0,5   , 3,0.2 ,"-","-",  ,            , 200,[ 25500,  729167,  617167,  617167,  514500],[0, 0,0,0,0,0,0,0]],
						[1602,[ 5, 2],"III","Hellstorm Anti-Mortar III","Hell-3" ,0,kWT.DEFS,kDT.AMRT, 0,28,   0,5   , 4,0.2 ,"-","-",  ,            , 400,[ 53550, 1822917, 1419483, 1419483, 1080450],[0, 0,0,0,0,0,0,0]],
						[1603,[ 5, 3],"IV" ,"Hellstorm Anti-Mortar IV" ,"Hell-4" ,0,kWT.DEFS,kDT.AMRT, 0,28,   0,5   , 5,0.2 ,"-","-",  ,            , 600,[ 81631, 4557292, 3264812, 3264812, 2268945],[0, 0,0,0,0,0,0,0]],

						[1620,[ 5, 8],"I"  ,"Phalanx Anti-Missile I"   ,"Plnx-1" ,0,kWT.DEFS,kDT.APEN, 5,30,   0,6   , 4,0.5 ,"-","-",  ,            , 125,[  9400,  200000,  160000,  160000,  600000],[]],
						[1621,[ 5, 9],"II" ,"Phalanx Anti-Missile II"  ,"Plnx-2" ,0,kWT.DEFS,kDT.APEN, 5,30,   0,6   , 5,0.55,"-","-",  ,{"dfP":0.95}, 250,[ 24500, 2150000, 1720000, 1720000, 3225000],[]],
						[1622,[ 5,10],"III","Phalanx Anti-Missile III" ,"Plnx-3" ,0,kWT.DEFS,kDT.APEN, 5,30,   0,6   , 6,0.65,"-","-",  ,{"dfP":0.90}, 500,[ 59200, 4675000, 3640000, 3740000, 9350000],[]],

						[2600,[12, 0],"A"  ,"Hailstorm Anti-Mortar A"  ,"Hail-A" ,1,kWT.DEFS,kDT.AMRT, 0,28,   0,5   , 3,0.25,"-","-",  ,            , 120,[  8460,  150000,  120000,  120000,  300000],[0, 0,0,0,0,0,0,0]],
						[2601,[12, 0],"B"  ,"Hailstorm Anti-Mortar B"  ,"Hail-B" ,1,kWT.DEFS,kDT.AMRT, 0,28,   0,5   , 4,0.25,"-","-",  ,{"dfE":0.95}, 240,[ 16980,  450000,  360000,  360000,  900000],[0, 0,0,0,0,0,0,0]],
						[2602,[12, 0],"C"  ,"Hailstorm Anti-Mortar C"  ,"Hail-C" ,1,kWT.DEFS,kDT.AMRT, 0,28,   0,5   , 5,0.25,"-","-",  ,{"dfE":0.9 }, 480,[ 33960, 1350000, 1080000, 1080000, 2700000],[0, 0,0,0,0,0,0,0]],

						[1700,[ 6, 0],null ,"Hornet UAV"               ,"Hrnt"   ,0,kWT.UAVS,kDT.PEN , 0,97,  66,2   , 1,1   ,"-","-",{"dmBldg":0.5,"swrmT":3.2,"swrmRl":0.6}, ,563,[0,0,0,0,0],[]],
						[1701,[ 6, 1],null ,"Dragonfly UAV"            ,"Drgn"   ,0,kWT.UAVS,kDT.BAL , 0,94, 110,4   , 1,1   ,"-","-",{"dmBldg":0.5,"swrmT":6.2,"swrmRl":1.5}, ,700,[0,0,0,0,0],[]],

						[2800,[13, 0],"U"  ,"Impulse Launcher D92-U"   ,"D92-U"  ,1,kWT.LNCH,kDT.RAD , 0,91, 160,2.5 , 4,0.7 ,"-","-",{"dmBldg":0.5 },{"arm":150},514,[0,0,0,0,0],[]],
						[2801,[13, 1],"F"  ,"Impulse Launcher D92-F"   ,"D92-F"  ,1,kWT.LNCH,kDT.RAD , 0,91, 648,2.5 , 9,0.7 ,"-","-",{"dmBldg":1.5 },{"arm":300},970,[0,0,0,0,0],[]],
						[2802,[13, 2],"S"  ,"Impulse Launcher D92-S"   ,"D92-S"  ,1,kWT.LNCH,kDT.RAD , 0,91, 900,6   , 1,0.5 ,"-","-",{"dmBldg":1.5 },{"arm":150},700,[0,0,0,0,0],[]]

					],
					[
						[   0,"NA"  ,0    ,"No Armor"             ,"[  ]"     ,0,   0,             ,  0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],

						[1000,[0, 0],"I"  ,"Iron I"               ,"[i1]"     ,0,  15,             , 10,[     0,     75,    225,    169,    113],[0,0 ,"r",0,0,0,0,0]],
						[1001,[0, 0],"II" ,"Iron II"              ,"[i2]"     ,0,  30,             , 20,[    60,    300,    900,    675,    450],[0,0 ,"r",0,0,0,0,0]],
						[1002,[0, 0],"III","Iron III"             ,"[i3]"     ,0,  60,             , 40,[   342,   1200,   3600,   2700,   1800],[0,0 ,"r",0,0,0,0,0]],
						[1003,[0, 0],"IV" ,"Iron IV"              ,"[i4]"     ,0, 120,             , 80,[   854,   4800,  14400,  10800,   7200],[0,0 ,"r",0,0,0,0,0]],

						[1010,[1, 0],"I"  ,"Steel I"              ,"[s1]"     ,0,  50,             , 20,[  1708,    833,   2500,   1875,   1250],[0,0 ,"r",0,0,0,0,0]],
						[1011,[1, 0],"II" ,"Steel II"             ,"[s2]"     ,0, 110,             , 44,[  2441,   4033,  12100,   9075,   6050],[0,0 ,"r",0,0,0,0,0]],
						[1012,[1, 0],"III","Steel III"            ,"[s3]"     ,0, 242,             , 97,[  3487,  19521,  58564,  43923,  29282],[0,0 ,"r",0,0,0,0,0]],
						[1013,[1, 0],"IV" ,"Steel IV"             ,"[s4]"     ,0, 532,             ,213,[  4981,  94483, 283450, 212587, 141725],[0,0 ,"r",0,0,0,0,0]],

						[1020,[2, 0],"I"  ,"Titanium I"           ,"[t1]"     ,0, 105,             , 30,[  7115,   3675,  11025,   8269,   5513],[0, 0,"r",0,0,0,0,0]],
						[1021,[2, 0],"II" ,"Titanium II"          ,"[t2]"     ,0, 231,             , 66,[ 10165,  17787,  53361,  40021,  26681],[0, 0,"r",0,0,0,0,0]],
						[1022,[2, 0],"III","Titanium III"         ,"[t3]"     ,0, 503,             ,145,[ 14521,  86089, 258267, 193700, 129134],[0, 0,"r",0,0,0,0,0]],
						[1023,[2, 0],"IV" ,"Titanium IV"          ,"[t4]"     ,0,1118,             ,319,[ 20745, 416671,1250013, 937510, 625007],[0, 0,"r",0,0,0,0,0]],

						[1030,[3, 0],"I"  ,"Depleted Uranium I"   ,"[du1]"    ,0, 203,             , 45,[ 29635,  13669,  41006,  30755,  20503],[0, 0,"r",0,0,0,0,0]],
						[1031,[3, 0],"II" ,"Depleted Uranium II"  ,"[du2]"    ,0, 446,             , 99,[ 42336,  66157, 198470, 148853,  99235],[0, 0,"r",0,0,0,0,0]],
						[1032,[3, 0],"III","Depleted Uranium III" ,"[du3]"    ,0, 980,             ,218,[ 60480, 320199, 960596, 720447, 480298],[0, 0,"r",0,0,0,0,0]],
						[1033,[3, 0],"IV" ,"Depleted Uranium IV"  ,"[du4]"    ,0,2156,             ,479,[ 86400,1549762,4649285,3486964,2324642],[0, 0,"r",0,0,0,0,0]],

						[2000,[0, 5],"M"  ,"Zynthonite Armor D1-M","[D1-M]"   ,1, 300,{"dfP":0.9 } , 67,[  7500, 135000, 180000, 180000, 270000],[2,"Revenge Raid III" ,"Quota Prize 1"]],
						[2001,[0, 6],"X"  ,"Zynthonite Armor D1-X","[D1-X]"   ,1, 450,{"dfE":0.9 } ,100,[ 12500, 270000, 360000, 360000, 540000],[2,"Revenge Raid III" ,"Quota Prize 2"]],
						[2002,[0, 7],"C"  ,"Zynthonite Armor D1-C","[D1-C]"   ,1, 600,{"dfB":0.9 } ,133,[ 17500, 450000, 600000, 600000, 900000],[2,"Revenge Raid III" ,"Quota Prize 3"]],

						[2010,[1, 5],"M"  ,"Zynthonite Armor D2-M","[D2-M]"   ,1, 750,{"dfP":0.9 } ,167,[ 21600, 330000, 660000, 495000, 990000],[3,"Unavailable"   ]],
						[2011,[1, 6],"X"  ,"Zynthonite Armor D2-X","[D2-X]"   ,1, 750,{"dfE":0.9 } ,167,[ 21600, 330000, 660000, 495000, 990000],[3,"Unavailable"   ]],
						[2012,[1, 7],"C"  ,"Zynthonite Armor D2-C","[D2-C]"   ,1, 750,{"dfB":0.9 } ,167,[ 21600, 330000, 660000, 495000, 990000],[3,"Unavailable"   ]],
						[2013,[1, 8],"V"  ,"Zynthonite Armor D2-V","[D2-V]"   ,1, 750,{"csp":1.05} ,167,[ 21600, 366667, 733333, 550000,1100000],[2,"Base Invaders III","Quota Prize 1"]],
						[2014,[1, 9],"N"  ,"Zynthonite Armor D2-N","[D2-N]"   ,1, 750,{"msp":1.1 } ,167,[ 17280, 293333, 586667, 440000, 880000],[1, 0,1,6]],
						[2015,[1,10],"T"  ,"Zynthonite Armor D2-T","[D2-T]"   ,1, 750,{"tsp":1.14} ,167,[ 17280, 293333, 586667, 440000, 880000],[1, 0,1,5]],
						[2016,[1,11],"E"  ,"Zynthonite Armor D2-E","[D2-E]"   ,1, 750,{"evd":0.925},167,[ 17280, 293333, 586667, 440000, 880000],[2,"Unavailable"   ]],
						[2017,[1,13],"S"  ,"Zynthonite Armor D2-S","[D2-S]"   ,1, 750,{"vsr":-5  } ,167,[ 21600, 366667, 733333, 550000,1100000],[2,"Base Invaders IV" ,"Quota Prize 2"]],
						[2018,[1,12],"P"  ,"Zynthonite Armor D2-P","[D2-P]"   ,1, 750,             ,167,[ 21600, 366667, 733333, 550000,1100000],[]],
						[2019,[1,14],"U"  ,"Zynthonite Armor D2-U","[D2-U]"   ,1, 750,{"dfB":0.97  ,"dfP":0.97 ,"dfE":0.97 },167,[ 21600, 366667, 733333, 550000,1100000],[]],

						[2020,[2, 5],"M"  ,"Zynthonite Armor D3-M","[D3-M]"   ,1,1250,{"dfP":0.9 } ,278,[ 43200, 675000,1350000,1012500,2025000],[3,"Unavailable"   ]],
						[2021,[2, 6],"X"  ,"Zynthonite Armor D3-X","[D3-X]"   ,1,1250,{"dfE":0.9 } ,278,[ 43200, 675000,1350000,1012500,2025000],[3,"Unavailable"   ]],
						[2022,[2, 7],"C"  ,"Zynthonite Armor D3-C","[D3-C]"   ,1,1250,{"dfB":0.9 } ,278,[ 43200, 675000,1350000,1012500,2025000],[3,"Unavailable"   ]],
						[2023,[2, 8],"V"  ,"Zynthonite Armor D3-V","[D3-V]"   ,1,1250,{"csp":1.05} ,278,[ 43200, 750000,1500000,1125000,2250000],[1,0 ,2,7]],
						[2024,[2, 9],"N"  ,"Zynthonite Armor D3-N","[D3-N]"   ,1,1250,{"msp":1.1 } ,278,[ 34560, 600000,1200000, 900000,1800000],[2,"Base Invaders V"  ,"Quota Prize 3"]],
						[2025,[2,10],"T"  ,"Zynthonite Armor D3-T","[D3-T]"   ,1,1250,{"tsp":1.14} ,278,[ 34560, 600000,1200000, 900000,1800000],[2,"Base Invaders IV" ,"Quota Prize 3"]],
						[2026,[2,11],"E"  ,"Zynthonite Armor D3-E","[D3-E]"   ,1,1250,{"evd":0.925},278,[ 34560, 600000,1200000, 900000,1800000],[2,"Base Invaders III","Quota Prize 2"]],
						[2028,[2,12],"P"  ,"Zynthonite Armor D3-P","[D3-P]"   ,1,1250,             ,278,[ 43230, 600000,1200000, 900000,1800000],[]],
						[2029,[2,14],"U"  ,"Zynthonite Armor D3-U","[D3-U]"   ,1,1250,{"dfB":0.965,"dfP":0.965,"dfE":0.965},278,[ 43230, 600000,1200000, 900000,1800000],[]],

						[2030,[3, 5],"M"  ,"Zynthonite Armor D4-M","[D4-M]"   ,1,1750,{"dfP":0.9 } ,389,[116640,1395000,2790000,2092000,4185000],[2,"Base Invaders III","Quota Prize 4"]],
						[2031,[3, 6],"X"  ,"Zynthonite Armor D4-X","[D4-X]"   ,1,1750,{"dfE":0.9 } ,389,[116640,1395000,2790000,2092000,4185000],[2,"Base Invaders V"  ,"Quota Prize 4"]],
						[2032,[3, 7],"C"  ,"Zynthonite Armor D4-C","[D4-C]"   ,1,1750,{"dfB":0.9 } ,389,[116640,1395000,2790000,2092000,4185000],[2,"Base Invaders IV" ,"Quota Prize 4"]],
						[2033,[3, 8],"V"  ,"Zynthonite Armor D4-V","[D4-V]"   ,1,1750,{"csp":1.05} ,389,[129600,1550000,3100000,2325000,4650000],[1, 0,3,8]],
						[2034,[3, 9],"N"  ,"Zynthonite Armor D4-N","[D4-N]"   ,1,1750,{"msp":1.1 } ,389,[103680,1240000,2480000,1860000,3720000],[1, 0,3,8]],
						[2035,[3,10],"T"  ,"Zynthonite Armor D4-T","[D4-T]"   ,1,1750,{"tsp":1.14} ,389,[103680,1240000,2480000,1860000,3720000],[1, 0,3,7]],
						[2036,[3,11],"E"  ,"Zynthonite Armor D4-E","[D4-E]"   ,1,1750,{"evd":0.925},389,[103680,1240000,2480000,1860000,3720000],[1, 0,3,7]],
						[2038,[3,12],"P"  ,"Zynthonite Armor D4-P","[D4-P]"   ,1,1750,             ,389,[103680,1240000,2480000,1860000,3720000],[]],
						[2039,[3,14],"U"  ,"Zynthonite Armor D4-U","[D4-U]"   ,1,1750,{"dfB":0.96 ,"dfP":0.96 ,"dfE":0.96 },389,[103680,1240000,2480000,1860000,3720000],[]]
					],
					[
						[   0,"NI"  ,0    ,"No Special"                 ,"---" ,0,                                              ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],

						[1000,[0, 0],"I"  ,"Layered Armor I"            ,"LA1" ,0,{"dfB":0.67,"wtAmr":0.05}                     ,   0,[ 19600, 194100, 183317, 215667, 143778],[0,0 ,"r",0,0,0,0,0]],
						[1001,[0, 1],"II" ,"Layered Armor II"           ,"LA2" ,0,{"dfB":0.5 ,"wtAmr":0.1 }                     ,   0,[ 28600,1474200,1392300,1638000,1092000],[0,0 ,"r",0,0,0,0,0]],
						[1002,[0, 2],"III","Layered Armor III"          ,"LA3" ,0,{"dfB":0.34,"wtAmr":0.15}                     ,   0,[ 37560,3990000,3768333,4433333,2955556],[0,0 ,"r",0,0,0,0,0]],
						[1010,[0, 3],"I"  ,"Reactive Armor I"           ,"RA1" ,0,{"dfP":0.67,"wtAmr":0.05}                     ,   0,[  3400,  16950,   16008,  18833, 12556],[0,0 ,"r",0,0,0,0,0]],
						[1011,[0, 4],"II" ,"Reactive Armor II"          ,"RA2" ,0,{"dfP":0.5 ,"wtAmr":0.1 }                     ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1012,[0, 5],"III","Reactive Armor III"         ,"RA3" ,0,{"dfP":0.34,"wtAmr":0.15}                     ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1020,[0, 6],"I"  ,"Ablative Armor I"           ,"AA1" ,0,{"dfE":0.67,"wtAmr":0.05}                     ,   0,[  7000,  38250,  36125,  42500,  28333],[0,0 ,"r",0,0,0,0,0]],
						[1021,[0, 7],"II" ,"Ablative Armor II"          ,"AA2" ,0,{"dfE":0.5 ,"wtAmr":0.1 }                     ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1022,[0, 8],"III","Ablative Armor III"         ,"AA3" ,0,{"dfE":0.34,"wtAmr":0.15}                     ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],

						[1100,[1, 0],"I"  ,"Thrusters I"                ,"TH1" ,0,{"tsp":1.39,"evd":0.96,"wtTot":0.02}          ,   0,[  1600,   7500,   7083,  8333,    5556],[0,0 ,"r",0,0,0,0,0]],
						[1101,[1, 1],"II" ,"Heavy Thrusters II"         ,"TH2" ,0,{"tsp":2   ,"evd":0.92,"wtTot":0.04}          ,   0,[ 10600,  38400,  36267,  42667,  28444],[0,0 ,"r",0,0,0,0,0]],
						[1102,[1, 2],"III","Ion Thrusters III"          ,"TH3" ,0,{"tsp":2.66,"evd":0.88,"wtTot":0.06}          ,   0,[ 21400, 384000, 362667, 426667, 284444],[0,0 ,"r",0,0,0,0,0]],
						[1110,[1, 3],"I"  ,"Guidance Scrambler I"       ,"GS1" ,0,{"evd":0.8 ,"wtTot":0.04}                     ,   0,[  8800,  25500,  24083,  28333,  18889],[0,0 ,"r",0,0,0,0,0]],
						[1111,[1, 4],"II" ,"Guidance Scrambler II"      ,"GS2" ,0,{"evd":0.67,"wtTot":0.08}                     ,   0,[ 14200,  86250,  81458,  95833,  63889],[0,0 ,"r",0,0,0,0,0]],
						[1112,[1, 5],"III","Guidance Scrambler III"     ,"GS3" ,0,{"evd":0.6 ,"wtTot":0.12}                     ,   0,[ 30400,2325000,2195833,2583333,1722222],[0,0 ,"r",0,0,0,0,0]],
						[1120,[1, 6],"I"  ,"Engine Upgrade I"           ,"Eng1",0,{"msp":1.25,"csp":1.3,"acN":0.9 ,"wtTot":0.05},   0,[  5200,  11250,  10625,  12500,   8333],[0,0 ,"r",0,0,0,0,0]],
						[1121,[1, 7],"II" ,"Engine Upgrade II"          ,"Eng2",0,{"msp":1.33,"csp":1.5,"acN":0.85,"wtTot":0.1 },   0,[ 26800,2211300,2088450,2457000,1638000],[0,0 ,"r",0,0,0,0,0]],
						[1122,[1, 8],"III","Engine Upgrade III"         ,"Eng3",0,{"msp":1.5 ,"csp":1.8,"acN":0.8 ,"wtTot":0.15},   0,[ 39400,4155000,3924157,4616667,3077778],[0,0 ,"r",0,0,0,0,0]],

						[1310,[4, 3],"I"  ,"Enhanced Warhead I"         ,"EW1" ,0,{"dmP":1.14,"wtWpn":0.06}                     ,   0,[  8800,  43500,  41083,  48333,  32222],[0,0 ,"r",0,0,0,0,0]],
						[1311,[4, 4],"II" ,"Enhanced Warhead II"        ,"EW2" ,0,{"dmP":1.21,"wtWpn":0.09}                     ,   0,[ 19600, 301500, 284750, 335000, 223333],[0,0 ,"r",0,0,0,0,0]],
						[1312,[4, 5],"III","Enhanced Warhead III"       ,"EW3" ,0,{"dmP":1.33,"wtWpn":0.12}                     ,   0,[ 32200,2820000,2663333,3133333,2088889],[0,0 ,"r",0,0,0,0,0]],
						[1420,[4, 6],"I"  ,"High Explosive Shells I"    ,"HE1" ,0,{"spl":1.14,"wtWpn":0.05}                     ,   0,[ 12400,  42600,  40233,  47333,  31556],[0,0 ,"r",0,0,0,0,0]],
						[1421,[4, 7],"II" ,"High Explosive Shells II"   ,"HE2" ,0,{"spl":1.15,"wtWpn":0.1 }                     ,   0,[ 23200, 337500, 318750, 375000, 250000],[0,0 ,"r",0,0,0,0,0]],
						[1422,[4, 8],"III","High Explosive Shells III"  ,"HE3" ,0,{"spl":1.50,"wtWpn":0.14}                     ,   0,[ 44760,4515000,4264167,5016667,3334444],[0,0 ,"r",0,0,0,0,0]],
						[1300,[3, 0],"I"  ,"Auto-loader I"              ,"AL1" ,0,{"rlB":1.39,"wtWpn":0.2 }                     ,   0,[ 12360,  57450,  54258,  63833,  42556],[0,0 ,"r",0,0,0,0,0]],
						[1301,[3, 1],"II" ,"Auto-loader II"             ,"AL2" ,0,{"rlB":1.75,"wtWpn":0.4 }                     ,   0,[ 23160, 655200, 618800, 728000, 485333],[0,0 ,"r",0,0,0,0,0]],
						[1302,[3, 2],"III","Auto-loader III"            ,"AL3" ,0,{"rlB":2.1 ,"wtWpn":0.6 }                     ,   0,[ 41200,4320000,4080000,4800000,3200000],[0,0 ,"r",0,0,0,0,0]],
						[1410,[3, 3],"I"  ,"Laser Targeting I"          ,"LT1" ,0,{"acP":1.2,"ret":true,"wtWpn":0.03}           ,   0,[  8800,  33000,  31167,  36667,  24444],[0,0 ,"r",0,0,0,0,0]],
						[1411,[3, 4],"II" ,"Laser Targeting II"         ,"LT2" ,0,{"acP":1.4,"ret":true,"wtWpn":0.06}           ,   0,[ 16000,  78750,  74375,  87500,  58333],[0,0 ,"r",0,0,0,0,0]],
						[1412,[3, 5],"III","Laser Targeting III"        ,"LT3" ,0,{"acP":1.6,"ret":true,"wtWpn":0.1 }           ,   0,[ 23200, 356250, 336458, 396833, 263889],[0,0 ,"r",0,0,0,0,0]],

						[2320,[0,18],"I"  ,"Cluster Warheads I"         ,"CW1" ,0,{"rlR":1.6 ,"wtWpn":0.09}                     ,   0,[  9600,  42500,  39375,  46700,  52050],[2,"Storm Warning"    ,"Quota Prize 1" ]],
						[2321,[0,19],"II" ,"Cluster Warheads II"        ,"CW2" ,0,{"rlR":2.1 ,"wtWpn":0.17}                     ,   0,[ 26000,1275000,1181250,1401000,1561500],[2,"Storm Warning"    ,"Quota Prize 2" ]],
						[2322,[0,21],"III","Cluster Warheads III"       ,"CW3" ,0,{"rlR":2.7 ,"wtWpn":0.3 }                     ,   0,[ 42540,4462500,3543750,3502500,3903750],[2,"Storm Warning"    ,"Quota Prize 3" ]],

						[1200,[2, 0],"I"  ,"Hardened Barrels I"         ,"HB1" ,0,{"rgB":1.25,"wtWpn":0.2 }                     ,   0,[ 16000, 129300, 122117, 143667,  95778],[0,0 ,"r",0,0,0,0,0]],
						[1201,[2, 1],"II" ,"Hardened Barrels II"        ,"HB2" ,0,{"rgB":1.35,"wtWpn":0.4 }                     ,   0,[ 32200,3316950,3132675,3685500,2457000],[0,0 ,"r",0,0,0,0,0]],
						[1202,[2, 2],"III","Hardened Barrels III"       ,"HB3" ,0,{"rgB":1.5 ,"wtWpn":0.6 }                     ,   0,[ 43000,4545000,4292500,5050000,3366667],[0,0 ,"r",0,0,0,0,0]],
						[1210,[2, 3],"I"  ,"Solid Fuel Booster I"       ,"SF1" ,0,{"rgP":1.1 ,"wtWpn":0.04}                     ,   0,[ 11900,  43500,  41083,  48333,  32222],[0,0 ,"r",0,0,0,0,0]],
						[1211,[2, 4],"II" ,"Solid Fuel Booster II"      ,"SF2" ,0,{"rgP":1.2 ,"wtWpn":0.08}                     ,   0,[ 24100, 675000, 637500, 750000, 500000],[0,0 ,"r",0,0,0,0,0]],
						[1212,[2, 5],"III","Solid Fuel Booster III"     ,"SF3" ,0,{"rgP":1.3 ,"wtWpn":0.12}                     ,   0,[ 39000,3975000,3754167,4416667,2944444],[0,0 ,"r",0,0,0,0,0]],
						[1220,[3, 6],"I"  ,"Electronic Range Finder I"  ,"ERF1",0,{"spr":0.91,"wtWpn":0.03}                     ,   0,[  5200,  12000,  11333,  13333,   8889],[0,0 ,"r",0,0,0,0,0]],
						[1221,[3, 7],"II" ,"Electronic Range Finder II" ,"ERF2",0,{"spr":0.81,"wtWpn":0.06}                     ,   0,[ 12400,  41400,  39100,  46000,  30667],[0,0 ,"r",0,0,0,0,0]],
						[1222,[3, 8],"III","Electronic Range Finder III","ERF3",0,{"spr":0.7 ,"wtWpn":0.09}                     ,   0,[ 19600, 281250, 265625, 312500, 208333],[0,0 ,"r",0,0,0,0,0]],

						[1500,[5, 0],"I"  ,"Cannon System I"            ,"CS1" ,0,{"rgB":1.1 ,"rlB":1.2 ,"wtWpn":0.35}          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1501,[5, 1],"II" ,"Cannon System II"           ,"CS2" ,0,{"rgB":1.2 ,"rlB":1.5 ,"wtWpn":0.5 }          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1502,[5, 2],"III","Cannon System III"          ,"CS3" ,0,{"rgB":1.35,"rlB":1.75,"wtWpn":0.9 }          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1510,[5, 3],"I"  ,"Missile System I"           ,"MS1" ,0,{"rgP":1.05,"acP":1.1 ,"wtWpn":0.06}          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1511,[5, 4],"II" ,"Missile System II"          ,"MS2" ,0,{"rgP":1.1 ,"acP":1.2 ,"wtWpn":0.09}          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1512,[5, 5],"III","Missile System III"         ,"MS3" ,0,{"rgP":1.25,"acP":1.4 ,"wtWpn":0.15}          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1520,[5, 6],"I"  ,"Explosive System I"         ,"ES1" ,0,{"spl":1.1 ,"spr":0.95,"wtWpn":0.1 }          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1521,[5, 7],"II" ,"Explosive System II"        ,"ES2" ,0,{"spl":1.25,"spr":0.85,"wtWpn":0.13}          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1522,[5, 8],"III","Explosive System III"       ,"ES3" ,0,{"spl":1.35,"spr":0.81,"wtWpn":0.19}          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],

						[1600,[6, 0],"I"  ,"Speed System I"             ,"SpS1",0,{"msp":1.25,"csp":1.2 ,"tsp":1.2 ,"evd":0.98,"acN":0.95,"wtTot":0.04},   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1601,[6, 1],"II" ,"Speed System II"            ,"SpS2",0,{"msp":1.33,"csp":1.4 ,"tsp":1.8 ,"evd":0.94,"acN":0.9 ,"wtTot":0.06},   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1602,[6, 2],"III","Speed System III"           ,"SpS3",0,{"msp":1.50,"csp":1.6 ,"tsp":2.2 ,"evd":0.91,"acN":0.85,"wtTot":0.11},   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1610,[6, 3],"I"  ,"Strike System I"            ,"SkS1",0,{"msp":1.25,"csp":1.2 ,"rgP":1.05,"wtTot":0.04}                      ,   0,[ 26800, 2211300, 2088450, 2457000, 1638000],[0,0 ,"r",0,0,0,0,0]],
						[1611,[6, 4],"II" ,"Strike System II"           ,"SkS2",0,{"msp":1.33,"csp":1.4 ,"rgP":1.1 ,"wtTot":0.06}                      ,   0,[ 30090, 2893772, 2733007, 3215303, 2143535],[0,0 ,"r",0,0,0,0,0]],
						[1612,[6, 5],"III","Strike System III"          ,"SkS3",0,{"msp":1.5 ,"csp":1.6 ,"rgP":1.25,"wtTot":0.11}                      ,   0,[ 42552, 4155000, 3924167, 4616667, 3077778],[0,0 ,"r",0,0,0,0,0]],

						[1530,[6, 9],"I"  ,"Stealth Attack System I"    ,"SAS1",0,{"mClk":1.1 ,"dmC":1.06,"wtTot":0.09}          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1531,[6,10],"II" ,"Stealth Attack System II"   ,"SAS2",0,{"mClk":1.19,"dmC":1.17,"wtTot":0.18}          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1532,[6,11],"III","Stealth Attack System III"  ,"SAS3",0,{"mClk":1.27,"dmC":1.21,"wtTot":0.30}          ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
			
						[1130,[1, 9],"I"  ,"Nautilus Battery I"         ,"NB1" ,0,{"mClk":1.15,"wtTot":0.1 }                     ,   0,[ 18400, 327000, 308833, 363333, 242222],[0,0 ,"r",0,0,0,0,0]],
						[1131,[1,10],"II" ,"Nautilus Battery II"        ,"NB2" ,0,{"mClk":1.27,"wtTot":0.19}                     ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1132,[1,11],"III","Nautilus Battery III"       ,"NB3" ,0,{"mClk":1.4 ,"wtTot":0.33}                     ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1430,[0, 9],"I"  ,"Caterpillar Drive I"        ,"CD1" ,0,{"eClk":0.8 ,"wtTot":0.05}                     ,   0,[ 18700, 291750, 275542, 324167, 216111],[0,0 ,"r",0,0,0,0,0]],
						[1431,[0,10],"II" ,"Caterpillar Drive II"       ,"CD2" ,0,{"eClk":0.6 ,"wtTot":0.1 }                     ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1432,[0,11],"III","Caterpillar Drive III"      ,"CD3" ,0,{"eClk":0.4 ,"wtTot":0.14}                     ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1330,[4, 9],"I"  ,"Concussion Warhead I"       ,"CW1" ,0,{"dmC":1.11,"wtWpn":0.03}                      ,   0,[ 16600,  93750,  88542, 104167,  69444],[0,0 ,"r",0,0,0,0,0]],
						[1331,[4,10],"II" ,"Concussion Warhead II"      ,"CW2" ,0,{"dmC":1.22,"wtWpn":0.06}                      ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1332,[4,11],"III","Concussion Warhead III"     ,"CW3" ,0,{"dmC":1.33,"wtWpn":0.1 }                      ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1230,[2, 9],"I"  ,"Sonar Pod I"                ,"SP1" ,0,{"snr":8 ,"wtTot":0.1 }                        ,   0,[ 16000, 121500, 114750, 135000,  90000],[0,0 ,"r",0,0,0,0,0]],
						[1231,[2,10],"II" ,"Sonar Pod II"               ,"SP2" ,0,{"snr":16,"wtTot":0.1 }                        ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],
						[1232,[2,11],"III","Sonar Pod III"              ,"SP3" ,0,{"snr":25,"wtTot":0.1 }                        ,   0,[     0,      0,      0,      0,      0],[0,0 ,"r",0,0,0,0,0]],

						[1260,[0,12],"I"  ,"Countermeasure Equipment I"  ,"CM1" ,0,{"rgAM":1.1 ,"acAM":1.05,"rgAP":1.1 ,"acAP":1.2 ,"wtWpn":0.03},   0,[0,0,0,0,0],[]],
						[1261,[0,13],"II" ,"Countermeasure Equipment II" ,"CM2" ,0,{"rgAM":1.3 ,"acAM":1.15,"rgAP":1.3 ,"acAP":1.3 ,"wtWpn":0.06},   0,[0,0,0,0,0],[]],
						[1262,[0,14],"III","Countermeasure Equipment III","CM3" ,0,{"rgAM":1.5 ,"acAM":1.2 ,"rgAP":1.5 ,"acAP":1.4 ,"wtWpn":0.09},   0,[0,0,0,0,0],[]],

						[2000,[0,15],"E"  ,"Compound Armor D5-E"        ,"CA1" ,1,{"dfB":0.89,"dfP":0.89,"dfE":0.89,"wtAmr":0.04},   0,[  7000,   38250,   36125,   42500,   28333],[0,0 ,"r",0,0,0,0,0]],
						[2001,[0,16],"M"  ,"Compound Armor D5-M"        ,"CA2" ,1,{"dfB":0.78,"dfP":0.78,"dfE":0.78,"wtAmr":0.06},   0,[ 25000,  982800,  982800, 1092000,  728000],[0,0 ,"r",0,0,0,0,0]],
						[2002,[0,17],"X"  ,"Compound Armor D5-X"        ,"CA3" ,1,{"dfB":0.67,"dfP":0.67,"dfE":0.67,"wtAmr":0.08},   0,[ 37600, 3990000, 3768333, 4433333, 2955556],[0,0 ,"r",0,0,0,0,0]],

						[2010,[1,16],"I"  ,"Alloy Armor MC-1"           ,"MC1" ,1,{"dfB":0.85,"dfP":0.85,"wtAmr":0.04}           ,   0,[0,0,0,0,0],[0,0 ,"r",0,0,0,0,0]],
						[2011,[1,16],"II" ,"Alloy Armor MC-2"           ,"MC2" ,1,{"dfB":0.7 ,"dfP":0.7 ,"wtAmr":0.06}           ,   0,[0,0,0,0,0],[0,0 ,"r",0,0,0,0,0]],
						[2012,[1,17],"III","Alloy Armor MC-3"           ,"MC3" ,1,{"dfB":0.55,"dfP":0.55,"wtAmr":0.12}           ,   0,[0,0,0,0,0],[0,0 ,"r",0,0,0,0,0]],
						[2020,[2,15],"I"  ,"Alloy Armor MX-1"           ,"MX1" ,1,{"dfP":0.85,"dfE":0.85,"wtAmr":0.04}           ,   0,[0,0,0,0,0],[0,0 ,"r",0,0,0,0,0]],
						[2021,[2,15],"II" ,"Alloy Armor MX-2"           ,"MX2" ,1,{"dfP":0.7 ,"dfE":0.7 ,"wtAmr":0.06}           ,   0,[0,0,0,0,0],[0,0 ,"r",0,0,0,0,0]],
						[2022,[2,17],"III","Alloy Armor MX-3"           ,"MX3" ,1,{"dfP":0.55,"dfE":0.55,"wtAmr":0.12}           ,   0,[0,0,0,0,0],[0,0 ,"r",0,0,0,0,0]],
						[2030,[3,15],"I"  ,"Alloy Armor CX-1"           ,"CX1" ,1,{"dfB":0.85,"dfE":0.85,"wtAmr":0.04}           ,   0,[0,0,0,0,0],[0,0 ,"r",0,0,0,0,0]],
						[2031,[3,16],"II" ,"Alloy Armor CX-2"           ,"CX2" ,1,{"dfB":0.7 ,"dfE":0.7 ,"wtAmr":0.06}           ,   0,[0,0,0,0,0],[0,0 ,"r",0,0,0,0,0]],
						[2032,[3,17],"III","Alloy Armor CX-3"           ,"CX3" ,1,{"dfB":0.55,"dfE":0.55,"wtAmr":0.12}           ,   0,[0,0,0,0,0],[0,0 ,"r",0,0,0,0,0]],

						[2100,[0,18],"I"  ,"Hull Streamlining I"        ,"HS1" ,1,{"msp_f":10}                      ,   0,[  3000,  75000,  60000,  60000,  56250],[0,0 ,"r",0,0,0,0,0]],
						[2101,[0,19],"II" ,"Hull Streamlining II"       ,"HS2" ,1,{"msp_f":17}                      ,   0,[  9000, 375000, 300000, 300000, 281250],[0,0 ,"r",0,0,0,0,0]],
						[2102,[0,20],"III","Hull Streamlining III"      ,"HS3" ,1,{"msp_f":25}                      ,   0,[ 27000,1875000,1500000,1500000,1406250],[0,0 ,"r",0,0,0,0,0]],

						[2200,[1,18],"I"  ,"Small Cargo Hold I"         ,"CH1" ,1,{"crg": 20000}                    ,  50,[   750,  50000,  40000,  40000, 200000],[0,0 ,"r",0,0,0,0,0]],
						[2201,[1,19],"II" ,"Medium Cargo Hold II"       ,"CH2" ,1,{"crg":100000}                    , 500,[0,0,0,0,0],[0,0 ,"r",0,0,0,0,0]],
						[2202,[1,20],"III","Large Cargo III"            ,"CH3" ,1,{"crg":500000}                    ,1000,[0,0,0,0,0],[0,0 ,"r",0,0,0,0,0]]
					],
					[
						[   0,[0, 0],0    ,"No Tactical Module"    ,"---",0,0, 0,   0,  ,  ,   0,[0,0,0,0,0],[1]],
						[1000,[0, 0],"I"  ,"Navigation Array I"    ,"NA1",0,1,40,1500,{"tsp":1.15},{"fsp_f": 7},1000,[0,0,0,0,0],[1]],
						[1001,[0, 0],"II" ,"Navigation Array II"   ,"NA2",0,1,60,3000,{"tsp":1.25},{"fsp_f":12},2000,[0,0,0,0,0],[1]],
						[1002,[0, 0],"III","Navigation Array III"  ,"NA3",0,1,80,4500,{"tsp":1.50},{"fsp_f":25},3000,[0,0,0,0,0],[1]],
						[1010,[0, 1],"I"  ,"Subsonic Cavitator I"  ,"SC1",0,2,35, 500,{"tClk":0}  ,{"snr":35,"dfC":0.9,"csp":1.1,"tsp":1.1 },1500,[0,0,0,0,0],[1]],
						[1011,[0, 1],"II" ,"Subsonic Cavitator II" ,"SC2",0,2,45,1000,{"tClk":0}  ,{"snr":45,"dfC":0.8,"csp":1.1,"tsp":1.15},2500,[0,0,0,0,0],[1]],
						[1012,[0, 1],"III","Subsonic Cavitator III","SC3",0,2,60,1500,{"tClk":0}  ,{"snr":60,"dfC":0.7,"csp":1.1,"tsp":1.2 },5000,[0,0,0,0,0],[1]],
						[1020,[0, 2],"I"  ,"Engine Disruptor I"    ,"ED1",0,2,66, 400,{"csp":0.6,"tsp":0.75},{"dfB":0.8 ,"dfP":0.8 ,"csp":1.1,"tsp":1.05},3000,[0,0,0,0,0],[1]],
						[1021,[0, 2],"II" ,"Engine Disruptor II"   ,"ED2",0,2,66, 800,{"csp":0.5,"tsp":0.5 },{"dfB":0.65,"dfP":0.65,"csp":1.2,"tsp":1.1 },4500,[0,0,0,0,0],[1]],
						[1022,[0, 2],"III","Engine Disruptor III"  ,"ED3",0,2,66,1200,{"csp":0.4,"tsp":0.25},{"dfB":0.5 ,"dfP":0.5 ,"csp":1.3,"tsp":1.2 },7500,[0,0,0,0,0],[1]],
						[1030,[0, 3],"I"  ,"Microwave Dampener I"  ,"MD1",0,2,74,1500,{"dmB":0.7,"dmP":0.8,"dmE":0.7,"dmC":0.9 },{"csp":1.1,"tsp":1.2},3500,[0,0,0,0,0],[1]],
						[1031,[0, 3],"II" ,"Microwave Dampener II" ,"MD2",0,2,74,3000,{"dmB":0.6,"dmP":0.7,"dmE":0.6,"dmC":0.85},{"csp":1.1,"tsp":1.2},5000,[0,0,0,0,0],[1]],
						[1032,[0, 3],"III","Microwave Dampener III","MD3",0,2,74,5000,{"dmB":0.5,"dmP":0.6,"dmE":0.5,"dmC":0.75},{"csp":1.1,"tsp":1.2},8500,[0,0,0,0,0],[1]],
						[1040,[0, 4],"I"  ,"Siege Scanner I"       ,"SC1",0,2,60,1500,  ,  ,3500,[0,0,0,0,0],[1]],
						[1041,[0, 4],"II" ,"Siege Scanner II"      ,"SC2",0,2,70,3000,  ,  ,4750,[0,0,0,0,0],[1]],
						[1042,[0, 4],"III","Siege Scanner III"     ,"SC3",0,2,80,6000,  ,  ,6500,[0,0,0,0,0],[1]],
						[1050,[0, 5],"I"  ,"Armor Bypass I"        ,"AB1",0,2,74,1000,{"dfB":1.2,"dfP":1.2,"dfE":1.2,"dfC":1.1},{"dfB":0.9,"dfP":0.9,"dfE":0.9,"csp":1.1 },3000,[0,0,0,0,0],[1]],
						[1051,[0, 5],"II" ,"Armor Bypass II"       ,"AB2",0,2,74,2000,{"dfB":1.3,"dfP":1.3,"dfE":1.3,"dfC":1.2},{"dfB":0.8,"dfP":0.8,"dfE":0.8,"csp":1.1 },5000,[0,0,0,0,0],[1]],
						[1052,[0, 5],"III","Armor Bypass III"      ,"AB3",0,2,74,3000,{"dfB":1.5,"dfP":1.5,"dfE":1.5,"dfC":1.3},{"dfB":0.7,"dfP":0.7,"dfE":0.7,"csp":1.15},7000,[0,0,0,0,0],[1]],
						[2000,[1, 0],"I"  ,"Blitz Drone Module I"  ,"BD1",1,2, 0,   0,  ,  ,3000,[0,0,0,0,0],[2,"Lightning Run","Quota Prize 2"]],
						[2001,[1, 0],"II" ,"Blitz Drone Module II" ,"BD2",1,2, 0,   0,  ,  ,4000,[0,0,0,0,0],[2,"Lightning Run","Quota Prize 3"]],
						[2002,[1, 0],"III","Blitz Drone Module III","BD3",1,2, 0,   0,  ,  ,7000,[0,0,0,0,0],[2,"Lightning Run","Quota Prize 4"]]
					]
				];

			for (var i = 0, ii = itemData.length; i < ii; i++) {
				ISTAT.push([]);
				for (var j = 0, jj = itemData[i].length; j < jj; j++)
					ISTAT[i].push(new Item[i](itemData[i][j]));
			}

			Item = null;

		})();

		// Methods

		ISTAT.getItemById  = function (x, id) { // not used
			var j = ISTAT[x].length;
			while (j--) if (ISTAT[x][j].id === id) return ISTAT[x][j];
		};
		ISTAT.getIndexById = function (x,id) {
			var j = ISTAT[x].length;
			while (j--) if (ISTAT[x][j].id === id) return j;
		};

		result.ISTAT = ISTAT;

	})();

	// Retrofit data

	(function () {

		var ISTAT = result.ISTAT;

		function Retrofit (i, a) {
			this.name       = a[0];
			this.blueprints = [];
			for (var j = 0, jj = a[1].length; j < jj; j++)
				this.blueprints.push(ISTAT.getItemById(i, a[1][j]));
			this.retrofits  = [];
			for (var j = 0, jj = a[2].length; j < jj; j++)
				this.retrofits.push(createModSet(a[2][j]));
		}
		Retrofit.prototype.isMatchingBP = function (item) {
			return this.blueprints.indexOf(item) !== -1;
		};
		Retrofit.prototype.printRank    = function (n) {return "[R" + n + "]";};

		// Init

		(function () {

			var retrofitData = [
					[
						["Hammerhead Hull A" ,[1017],[{"crg":2000000},{"tsp_f":6},{"evd_f":-0.2},{"dfB_f":0.4},{"rlM":1.5 }]],
						["Hammerhead Hull B" ,[1027],[{"crg":2000000},{"csp_f":1},{"evd_f":-0.2},{"dfE_f":0.4},{"rlP":1.5 }]],
						["Sea Scorpion A"    ,[1111],[{"crg":400000},{"evd_f":-0.1},{"csp_f":2},{"dfB_f":0.4},{"rlP":1.3 }]],
						["Barracuda"         ,[1402],[{"tsp_f":3},{"dfP_f":0.1},{"csp_f":1},{"evd_f":-0.2},{"msp_f":3,"csp_f":1}]],
						/*["Goliath"           ,[1301],[{"dfE":0.9},{"evd_f":-0.1},{},{"rlB":1.19},{"msp_f":3,"csp_f":1}]],*/
						["Battlecruiser"     ,[2004],[{"crg":720227},{"msp_f":2,"csp_f":1},{"snr":15},{"acN":1.2},{"dfC_f":0.2 ,"evd_f":-0.1}]],
						["Battleship"        ,[2005],[{"msp_f":4,"crg":700000},{"tsp_f":3},{"rlB":1.3 },{"csp_f":2},{"evd_f":-0.2}]]
					],
					[
						["Impact Cannons Retrofit"        ,[2100,2101,2102,2103]     ,[{"rlN":1.03}]],
						["Assault Cannons Retrofit"       ,[2110,2111,2112,2113,2130],[{"acN":1.015,"rlN":1.015}]],
						["Siege Cannons Retrofit"         ,[2120,2121,2122,2123,2124],[{"dmBldg":1.03}]],
						["Strike Missiles Retrofit"       ,[2200,2201,2202]          ,[{"rlN":1.03}]],
						["Assault Missiles Retrofit"      ,[2210,2211,2212]          ,[{"acN":1.015,"rlN":1.015}]],
						["Siege Missiles Retrofit"        ,[2220,2221,2222]          ,[{"dmBldg":1.03}]],
						["Shockwave Mortars Retrofit"     ,[2300,2301,2302,2303]     ,[{"rlN":1.03}]],
						["Assault Mortars Retrofit"       ,[2310,2311,2312,2313]     ,[{"spl":1.03}]],
						["Siege Mortars Retrofit"         ,[2320,2321,2322,2323]     ,[{"dmBldg":1.03}]],
						["Firestorm Rockets Retrofit"     ,[2400,2401,2402,2403]     ,[{"rlN":1.03}]],
						["Assault Rockets Retrofit"       ,[2410,2411,2412,2413]     ,[{"spl":1.03}]],
						["Siege Rockets Retrofit"         ,[2420,2421,2422,2423]     ,[{"dmBldg":1.03}]],
						["Countermeasure Weapons Retrofit",[1620,1621,1622,2600,2601,2602],[{"rgN":1.015,"rlN":1.015}]],
						["Vortex Torpedoes Retrofit"      ,[2500,2501,2502]          ,[{"rlN":1.03}]],
						["Assault Torpedoes Retrofit"     ,[2510,2511,2512,2513]     ,[{"acN":1.015,"rlN":1.015}]],
						["Siege Torpedoes Retrofit"       ,[2520,2521,2522]          ,[{"dmC":1.03}]],
						["Depth Charges Retrofit"         ,[1520,1521,1522,1530,1531,1532],[{"dmC":1.03}]]
					],
					[
						["Penetrative Defense Armor Retrofit",[2000,2010,2020,2030],[{"dfP":0.97}]],
						["Explosive Defense Armor Retrofit"  ,[2001,2011,2021,2031],[{"dfE":0.97}]],
						["Ballistic Defense Armor Retrofit"  ,[2002,2012,2022,2032],[{"dfB":0.97}]],
						["Streamlined Armor Retrofit"        ,[2013,2014,2015,2023,2024,2025,2033,2034,2035],[{"msp":1.03,"csp":1.03,"tsp":1.03}]],
						["Lightweight Armor Retrofit"        ,[2016,2026,2036]     ,[{"evd":0.97}]],
						["Stealth Armor Retrofit"            ,[2017]               ,[{"eClk":0.97}]],
						["Echo Armor Retrofit"               ,[2018,2028,2038]     ,[{"snr":1.03}]],
						["Compound Defense Armor Retrofit"   ,[2019,2029,2039]     ,[{"dfB":0.97,"dfP":0.97,"dfE":0.97}]],
					],
					[
					]
				];

			var RETROFIT_DATA = [];

			for (var i = 0, ii = retrofitData.length; i < ii; i++) {
				RETROFIT_DATA.push([]);
				for (var j = 0, jj = retrofitData[i].length; j < jj; j++)
					RETROFIT_DATA[i].push(new Retrofit(i, retrofitData[i][j]));
			}

			result.RETROFIT_DATA = RETROFIT_DATA;

		})();

	})();

	// Ship Rank Data

	result.RANK_DATA = [
		{name : "Inexperienced" , bonus : 1   },
		{name : "Recruit 1"     , bonus : 1.05},
		{name : "Recruit 2"     , bonus : 1.10},
		{name : "Recruit 3"     , bonus : 1.15},
		{name : "Recruit 4"     , bonus : 1.20},
		{name : "Hunter 1"      , bonus : 1.25},
		{name : "Hunter 2"      , bonus : 1.29},
		{name : "Hunter 3"      , bonus : 1.33},
		{name : "Hunter 4"      , bonus : 1.37},
		{name : "Hunter 5"      , bonus : 1.41},
		{name : "Elite 1"       , bonus : 1.45},
		{name : "Elite 2"       , bonus : 1.48},
		{name : "Elite 3"       , bonus : 1.51},
		{name : "Elite 4"       , bonus : 1.54},
		{name : "Elite 5"       , bonus : 1.57},
		{name : "Veteran 1"     , bonus : 1.60},
		{name : "Veteran 2"     , bonus : 1.62},
		{name : "Veteran 3"     , bonus : 1.62},
		{name : "Veteran 4"     , bonus : 1.66},
		{name : "Veteran 5"     , bonus : 1.68},
		{name : "Specialist 1"  , bonus : 1.70},
		{name : "Specialist 2"  , bonus : 1.71},
		{name : "Specialist 3"  , bonus : 1.71},
		{name : "Specialist 4"  , bonus : 1.73},
		{name : "Specialist 5"  , bonus : 1.74},
		{name : "Legendary"     , bonus : 1.75}
	];

	// Dock Level Data

	result.DOCK_DATA = [500, 780, 1217, 1898, 2961, 4619, 7206, 11242, 17537, 27548];

	//
	// Data Classes
	//

	(function () {

		var ISTAT = result.ISTAT;

		// Custom Data Classes

		var createRetrofitGroup = (function () {

			function RetrofitGroup (rFits) {
				this.hasRetrofits = rFits;
			}
			RetrofitGroup.prototype.findRetroMods = function (item) {
				// Expects: Part, Returns: ModSet
				var _hasRetros = this.hasRetrofits,
					retroMods  = createModSet(),
					_rFit;
				for (var i = 0, ii = _hasRetros.length; i < ii; i++)
					for (var j = 0, jj = _hasRetros[i].length; j < jj; j++) {
						_rFit = bpa.RETROFIT_DATA[i][j];
						if (_rFit.isMatchingBP(item))
							for (var k = 0, kk = _hasRetros[i][j] + 1; k < kk; k++)
								retroMods.setStack(_rFit.retrofits[k]);
					}
				return retroMods;
			};

			return function createRetrofitGroup(rFits) {return new RetrofitGroup(rFits);};

		})();

		result.createRetrofitGroup = createRetrofitGroup;

		// Ship build data

		function ShipPlan (a, r) {
			// Expects: Part Array a (optional), Number r (optional)
			var slotVals  = [],
				hull      = (a && a[0] && a[0][0])? a[0][0] : ISTAT[0][0],
				hullSlots = hull.slots;
			for (var i = 0, ii = hullSlots.length; i < ii; i++) {
				slotVals.push([]);
				for (var j = 0, jj = hullSlots[i]; j < jj; j++) {
					slotVals[i].push((a && a[i] && a[i][j])? a[i][j] : ISTAT[i][0]);
				}
			}
			this.slotVals  = slotVals; // What is in each slot
			this.shipRank  = r || 0;  // The ship rank level
			//this.isValid
		}
		ShipPlan.prototype.swap        = function (shipPlan) {
			this.slotVals  = shipPlan.slotVals;
			this.shipRank  = shipPlan.shipRank;
		};
		ShipPlan.prototype._checkSlots = function ()      {
			var slotVals  = this.slotVals,
				hull      = slotVals[0][0],
				hullSlots = hull.slots;
			for (var i = 1, ii = hullSlots.length; i < ii; i++) {
				slotVals[i].length = hullSlots[i];
				for (var j = 0, jj = hullSlots[i]; j < jj; j++)
					if (
						!slotVals[i][j] ||
						(i === 1 && !hull.isValidWeapon(j, slotVals[i][j]))
					)
						slotVals[i][j] = ISTAT[i][0];
			}
		};
		ShipPlan.prototype.requip      = function (a, r)   {
			// Partial ship plan reassignment
			// Expects: Part Array a (optional), Number r (optional)
			var slotVals  = this.slotVals,
				hull      = (a && a[0] && a[0][0])? a[0][0] : slotVals[0][0],
				hullSlots = hull.slots;
			for (var i = 0, ii = hullSlots.length; i < ii; i++)
				for (var j = 0, jj = hullSlots[i]; j < jj; j++)
					if (a && a[i] && a[i][j])
						slotVals[i][j] = a[i][j];
			this._checkSlots();
			if (!window.isNaN(r)) this.shipRank = r;
		};
		ShipPlan.prototype.setItem     = function (x, y, s) {
			// Expects: Number x, Number y, Number s
			this.slotVals[x][s] = ISTAT[x][y];
			this._checkSlots();
		};
		ShipPlan.prototype.getItem     = function (x, s)   {
			// Safe method for retrieving ship items
			return this.slotVals[x][s] || ISTAT[x][0];
		};
		ShipPlan.prototype.setRank     = function (n)     {
			if (!window.isNaN(n))
				this.shipRank = n;
			else {
				if (this.shipRank !== 25) this.shipRank++;
				else                      this.shipRank = 0;
			}
		};

		// Ship stats

		function ShipStat (shipPlan, yL, fleetData) { // Ship stats
			var hull      = shipPlan.slotVals[0][0],
				rankBonus = bpa.RANK_DATA[shipPlan.shipRank].bonus,
				yardLevel = yL || 0,
				mods;

			// Ship plan
			this.plan = shipPlan;

			// Calculate modifiers
			mods = this.mods = this._getMods(fleetData);

			// Calculate ship stats
			this.detectRng   = hull.sonarRng + mods.getVal("snr");
			this.cargo       = hull.cargo + mods.getVal("crg");

			this.mSpeed = (hull.mSpeed + mods.getVal("msp_f")) * mods.getVal("msp");
			this.cSpeed = (hull.cSpeed + mods.getVal("csp_f")) * mods.getVal("csp");
			this.tSpeed = (hull.tSpeed + mods.getVal("tsp_f")) * mods.getVal("tsp");
			this.evade  = (hull.evade  + mods.getVal("evd_f")) * mods.getVal("evd");

			this.defB = 1 - mods.getVal("dfB") * (1 - mods.getVal("dfB_f"));
			this.defP = 1 - mods.getVal("dfP") * (1 - mods.getVal("dfP_f"));
			this.defE = 1 - mods.getVal("dfE") * (1 - mods.getVal("dfE_f"));
			this.defC = 1 - mods.getVal("dfC") * (1 - mods.getVal("dfC_f"));
			this.defU = 1 - mods.getVal("dfU") * (1 - mods.getVal("dfU_f"));

			// Calculate submarine properties
			this.surfaceTime = hull.sMods.getVal("tSrf");
			this.cloakTime   = hull.sMods.getVal("tClk") * mods.getVal("mClk");
			this.isSub       = this.cloakTime > 0;

			// Calculate ship totals
			this.armor  = this._getArmor();
			this.rZon   = this._getDmgZones(fleetData);
			this.weight = this._getWeight(yardLevel);
			this.bCost  = this._getBuildCost();
			this.rCost  = this._getRepairCost();

		}
		ShipStat.prototype._getMods       = function (fleetData) {
			var shipPlan  = this.plan,
				hull      = shipPlan.slotVals[0][0],
				rankBonus = bpa.RANK_DATA[shipPlan.shipRank].bonus,
				fleetMods = (fleetData)? fleetData._getMods()    : null,
				retrofits = (fleetData)? fleetData.retrofitGroup : null,
				mods      = createModSet(),
				retroMods,
				item;

			// Item bonuses
			for (var i = 0, ii = hull.slots.length; i < ii; i++) {
				for (var j = 0, jj = hull.slots[i]; j < jj; j++) {
					item = shipPlan.getItem(i, j);
					mods.setStack(item.sMods);
					if (retrofits && (i === 0 || i === 2 || i === 3))
						mods.setStack(retrofits.findRetroMods(item));
				}
			}

			// Fleet bonuses
			if (fleetMods instanceof Object) mods.setStack(fleetMods);

			// Rank bonus
			mods.stackVal("rlN", rankBonus);
			mods.stackVal("tsp", rankBonus);

			return mods;

		};
		ShipStat.prototype._getArmor      = function () {
			var shipPlan = this.plan,
				hull     = shipPlan.slotVals[0][0],
				armor    = hull.armor + this.mods.getVal("arm");

			// Sum armor
			for (var j = 0, jj = hull.slots[2]; j < jj; j++)
				armor += shipPlan.getItem(2, j).armor;

			// Tactical module armor
			for (var j = 0, jj = hull.slots[4]; j < jj; j++)
				armor += shipPlan.getItem(4, j).armor;

			return armor;
		};
		ShipStat.prototype._getDmgZones   = function (fleetData) {
			var shipPlan  = this.plan,
				hullSlots = shipPlan.slotVals[0][0].slots,
				mods      = this.mods,
				a = [],
				b = [],
				newDmgZone,
				item,
				pMods;

			// Finds all range limits
			for (var j = 0, jj = hullSlots[1]; j < jj; j++) {
				item  = shipPlan.getItem(1,j);
				pMods = this._getPMods(item, fleetData);
				a.push(item.minRng);
				a.push(this.getPRng(item, fleetData));
			}
			a.sort(function (a, b) {return (a > b)? 1 : (a < b)? -1 : 0;});

			// Eliminates repeats
			for (var i = 0; i < a.length-1;) {
				if (a[i]===a[i + 1]) a.splice(i, 1);
				else i++;
			}

			// Finds damage zones
			for (var i = 0, ii = a.length - 1; i < ii; i++) {
				newDmgZone = new DmgZone(a[i], a[i + 1], 0);
				for (var j = 0, jj = hullSlots[1]; j < jj; j++) {
					item  = shipPlan.getItem(1, j);
					pMods = this._getPMods(item, fleetData);
					if (newDmgZone.isInScope(item, pMods))
						newDmgZone.dmg += this.getPDPS(item, fleetData);
				}
				if (newDmgZone.dmg > 0) b.push(newDmgZone);
			}

			return b;
		};
		ShipStat.prototype._getWeight     = function (yL) {
			var shipPlan     = this.plan,
				hull         = shipPlan.slotVals[0][0],
				hullSlots    = hull.slots,
				mods         = this.mods,
				hiddenWeight = window.Math.floor(hull.armor / 4),
				flatWeight   = [0];

			// Sum total weight
			for (var i = 1, ii = hullSlots.length; i < ii; i++) {
				flatWeight.push(0);
				for (var j = 0, jj = hullSlots[i]; j < jj; j++)
					flatWeight[i] += shipPlan.getItem(i, j).getWeight(yL);
			}

			return window.Math.floor(
				(
					window.Math.floor(flatWeight[1] * mods.getVal("wtWpn")) +
					window.Math.floor(flatWeight[2] * mods.getVal("wtAmr")) +
					window.Math.floor(flatWeight[3]) +
					window.Math.floor(flatWeight[4] * mods.getVal("wtTct"))
				) *
				mods.getVal("wtTot") +
				window.Math.floor(hiddenWeight * mods.getVal("wtAmr")) - hiddenWeight
			);
		};
		ShipStat.prototype._getBuildCost  = function () {
			var shipPlan  = this.plan,
				hullSlots = shipPlan.slotVals[0][0].slots,
				mods      = this.mods,
				resCost   = createResCost();

			// Sum item resource costs
			for (var i = 0, ii = hullSlots.length; i < ii; i++) {
				for (var j = 0, jj = hullSlots[i]; j < jj; j++) {
					resCost.setSum(shipPlan.getItem(i, j).costs);
				}
			}

			// Master engineer
			resCost[0] *= mods.getVal("tBld");

			return resCost;
		};
		ShipStat.prototype._getRepairCost = function () {
			var shipPlan  = this.plan,
				hull      = shipPlan.slotVals[0][0],
				rankBonus = bpa.RANK_DATA[shipPlan.shipRank].bonus,
				mods      = this.mods,
				buildCost = this.bCost.clone();

			// Get repair costs
			for (var i = 0, ii = buildCost.length; i < ii; i++)
				buildCost[i] = window.Math.floor(
					window.Math.floor(buildCost[i] / (75 + 20 * (1 - rankBonus)))
				);

			// Master fixer
			buildCost[0] = this.armor * hull.repMod * mods.getVal("tRpr");

			return buildCost;
		};
		ShipStat.prototype._getPMods      = function (item, fleetData) {
			var rMods =
				(fleetData && fleetData.retrofitGroup)?
					fleetData.retrofitGroup.findRetroMods(item) : null;
			return this.mods.getStack(item.pMods).getStack(rMods);
		};
		ShipStat.prototype.getDmg         = function (dT0,dT1,range,fleetData) {
			var shipPlan = this.plan,
				total    = 0,
				item,
				pMods;

			for (var j = 0, jj = shipPlan.slotVals[1].length; j < jj; j++) {
				item  = shipPlan.getItem(1, j);
				pMods = this._getPMods(item, fleetData);
				if (window.isNaN(range) || item.isInRange(range, pMods)) {
					total += item.getDmg(dT0, dT1, _pMods);
				}
			}

			return total;
		};
		ShipStat.prototype.getDPS         = function (dT0, dT1, range, fleetData) {
			var shipPlan = this.plan,
				total    = 0,
				item,
				pMods;

			for (var j = 0, jj = shipPlan.slotVals[1].length; j < jj; j++) {
				item  = shipPlan.getItem(1, j);
				pMods = this._getPMods(item, fleetData);
				if (window.isNaN(range) || item.isInRange(range, pMods)) {
					total += item.getDPS(dT0, dT1, pMods);
				}
			}

			return total;
		};
		ShipStat.prototype.getPDPS        = function (item, fleetData) {
			return item.getDPS(kDT.SHIP, kDT.NON, this._getPMods(item, fleetData));
		};
		ShipStat.prototype.getPCPS        = function (item, fleetData) {
			return item.getCPS(this._getPMods(item, fleetData));
		};
		ShipStat.prototype.getPRng        = function (item, fleetData) {
			var pMods = this._getPMods(item, fleetData);
			return item.getModMaxRng(pMods);
		};
		ShipStat.prototype.checkIfValid   = function () {
			return this.weight <= shipPlan.slotVals[0][0].weight;
		};

		function DmgZone (min, max, dmg) {this.max = max; this.min = min; this.dmg = dmg;}
		DmgZone.prototype.isInRange = function (d) {return d >= this.min && d <= this.max;};
		DmgZone.prototype.isInScope = function (weap, mods) {
			return this.min >= weap.minRng && this.max <= weap.getModMaxRng(mods);
		};

		// Fleet build data and stats
		function FleetData (n) {
			var shipPlans = [],
				shipStats = [],
				newShipPlan;
			this._fleetSize = (!window.isNaN(n))? n : 5;
			this.yardLevel  = 0;
			this.dockLevel  = 0;
			for (var k = 0, kk = this._fleetSize; k < kk; k++) {
				newShipPlan = new ShipPlan();
				shipPlans.push(newShipPlan);
				shipStats.push(new ShipStat(newShipPlan));
			}
			this.plan = {
				ships    : shipPlans,
				officers : {fsp : false, bt : false, rt : false},
				crew     : null
			};
			this.stat  = {
				ships  : shipStats,
				weight : null,
				mSpeed : null,
				mods   : null
			};
			this.retrofitGroup = null;
		}
		FleetData.prototype.setShip      = function (k, shipPlan) {
			this.plan.ships[k] = shipPlan;
			this.stat.ships[k] = new ShipStat(shipPlan, this.yardLevel, this);
			this.updateStats();
		};
		FleetData.prototype.setYardLevel = function (yL) {
			this.yardLevel = yL;
			for (var k = 0, kk = this._fleetSize; k < kk; k++) {
				this.stat.ships[k] = new ShipStat(this.plan.ships[k], yL, this);
			}
			this.updateStats();
		};
		FleetData.prototype.updateStats  = function () {
			this.stat.weight = this._getWeight();
			this.stat.mSpeed = this._getMSpeed();
			//this.stat.mods   = this._getMods();
		};
		FleetData.prototype._getWeight   = function () {
			var shipStats = this.stat.ships,
				_wt = 0;
			for (var k = 0, kk = shipStats.length; k < kk; k++)
				_wt += shipStats[k].weight;
			return _wt;
		};
		FleetData.prototype._getMSpeed   = function () {
			var shipStats = this.stat.ships,
				_fsp      = shipStats[0].mSpeed;
			for (var k = 0, kk = shipStats.length; k < kk; k++) {
				if (shipStats[k].mSpeed < _fsp) {
					_fsp = shipStats[k].mSpeed;
				}
			}
			if (this.plan.officers.fsp) _fsp *= 1.1;
			return _fsp;
		};
		FleetData.prototype._getMods     = function () {
			var modVals = {};
			if (this.plan.officers.fsp) modVals.msp  = 1.1;
			if (this.plan.officers.bt)  modVals.tBld = 0.9;
			if (this.plan.officers.rt)  modVals.tRpr = 0.9;
		//	TODO: rogue crews mods
			return createModSet(modVals);
		};
		FleetData.prototype.setRetrofits = function (rFits) {
			this.retrofitGroup = createRetrofitGroup(rFits);
		};
		FleetData.prototype.checkIfValid = function () {
			//var hull = shipPlan.slotVals[0][0];
			//return (
			//	this.weight <= hull.weight
			//);
		};

		// Export methods
		result.createShipPlan = function (a, r) {return new ShipPlan(a, r);};
		result.createShipStat  = function (shipPlan, yL, fleetMods, retroMods) {
			return new ShipStat(shipPlan, yL, fleetMods, retroMods);
		};
		result.createFleetData = function (n) {return new FleetData(n);};

	})();

	//
	// DOM Modification
	//

	(function () {

		//
		// DOM Utilities
		//

		function removeElement (node) {
			if (node && node.parentNode)
				node.parentNode.removeChild(node);
		}

		function removeAllChildren (node) {
			while (node.firstChild)
				node.removeChild(node.firstChild);
		}

		function replaceElement (oldNode, newNode) {
			oldNode.parentNode.appendChild(newNode);
			removeElement(oldNode);
		}

		function setTextNode (node, text) {
			removeAllChildren(node);
			node.appendChild(document.createTextNode(text));
		}

		result.removeElement     = removeElement;
		result.removeAllChildren = removeAllChildren;
		result.replaceElement    = replaceElement;
		result.setTextNode       = setTextNode;

		//
		// Event Handling
		//

		var addEventHandler      = (function () {
			if (document.addEventListener) {
				return function (target, type, handler) {
					target.addEventListener(type, handler, false);
				};
			}
			else if (document.attachEvent) {
				return function (target, type, handler) {
					target.attachEvent("on" + type, handler);
				};
			}
			else{
				return function (target, type, handler) {
					target["on" + type] = handler;
				};
			}
		})();

		var stopEventPropagation = (function () {
			if (Event.prototype.stopPropagation)
				return function (e) {e = e || window.event; e.stopPropagation();};
			else if (Event.prototype.cancelBubble)
				return function (e) {e = e || window.event; e.cancelBubble = true;};
		})();

		result.addEventHandler      = addEventHandler;
		result.stopEventPropagation = stopEventPropagation;

		// Key Press Events

		(function () {
			var KEY = {
					TAB : 9, ENTER : 13, SHIFT : 16, ESC : 27,
					LEFT : 37, UP : 38, RIGHT : 39, DOWN : 40,
					N0 : 48, N1 : 49, N2 : 50, N3 : 51, N4 : 52,
					N5 : 53, N6 : 54, N7 : 55, N8 : 56, N9 : 57,
					A : 65, B : 66, C : 67, D : 68, E : 69, F : 70, G : 71, H : 72,
					I : 73, J : 74, K : 75, L : 76, M : 77, N : 78, O : 79, P : 80,
					Q : 81, R : 82, S : 83, T : 84, U : 85, V : 86, W : 87, X : 88,
					Y : 89, Z : 90
				},
				_keys = {};

			function addKey (keyName, f) {
				if (KEY.hasOwnProperty(keyName)) _keys[KEY[keyName]] = f;
			}

			function pressKey () {
				var x;
				if (window.event) // IE8 and earlier
					x = event.keyCode;
				else if (event.which) // IE9/Firefox/Chrome/Opera/Safari
					x = event.which;
				if (_keys[x]) _keys[x](event);
			}

			result.keyControls = {
				addKey   : addKey,
				pressKey : pressKey
			};

		})();

		// DOM creation

		result.createButton = function (s, f) {
			var newInput = document.createElement("input");
			newInput.classList.add("button-small");
			newInput.type = "button";
			newInput.value = s;
			addEventHandler(newInput, "click", f);
			return newInput;
		};

		//
		// Custom Classes for DOM wrappers
		//

		// Tabs

		(function () {

			function Tab (button, window) {
				this.button = button;
				this.window = window;
			}

			function TabGroup () {
				this.children = [];   // Array of type Tab
				this.selected = null; // selected Tab
			}
			TabGroup.prototype.push   = function (button, window) {
				var i = this.children.push(new Tab (button, window)) - 1;
				addEventHandler(button, "click", this.select.bind(this, i));
				return i + 1;
			};
			TabGroup.prototype.select = function (i) {
				if (this.selected) {
					this.selected.window.classList.add("hidden");
					this.selected.button.classList.remove("focus");
				}
				this.selected = this.children[i];
				this.selected.window.classList.remove("hidden");
				this.selected.button.classList.add("focus");
			};

			result.createTabGroup = function () {return new TabGroup();}

		})();

		// Menus

		(function () {

			/**
			 * Menu
			 *
			 * @constructor
			 * @param {Element} elem
			 * @param {Element} head
			 */
			function Menu (elem, head) {
				/**
				 * @member {Element} MenuGroup.elem
				 * @member {Element} MenuGroup.head
				 */
				this.elem  = elem;
				this._head = head;
			}
			Menu.prototype.setHeader = function (s) {setTextNode(this._head, s);};

			/**
			 * MenuGroup
			 *
			 * @constructor
			 * @param {Element} elem
			 */
			function MenuGroup (elem) {
				/**
				 * @member {Element}      MenuGroup.elem
				 * @member {Array.<Menu>} MenuGroup.children
				 * @member {Menu|null}    MenuGroup.selected
				 */
				this.elem     = elem;
				this.children = [];
				this.selected = null;
			}
			MenuGroup.prototype.push  = function (menu) {
				return this.children.push(menu);
			};
			MenuGroup.prototype.close = function () {
				this.elem.classList.add("hidden");
				if (this.selected) this.selected.elem.classList.add("hidden");
			};
			MenuGroup.prototype.open  = function (i) {
				this.close();
				if (this.children[i] instanceof Menu) {
					this.selected = this.children[i];
					this.elem.classList.remove("hidden");
					this.selected.elem.classList.remove("hidden");
				}
			};
			MenuGroup.prototype.createMenu = function (menuBox, menuButtons) {
				var newMenuElem = document.createElement("div"),
					newMenuH2   = document.createElement("h2"),
					newMenuBody = document.createElement("div"),
					newMenuFoot = document.createElement("div");
				newMenuElem.classList.add("sy-menu");
				newMenuElem.classList.add("hidden");
				newMenuElem.appendChild(newMenuH2);
				newMenuBody.classList.add("menu-body");
				newMenuBody.appendChild(menuBox);
				newMenuElem.appendChild(newMenuBody);
				newMenuFoot.classList.add("menu-footer");
				newMenuFoot.classList.add("button-group");
				for (var i = 0, ii = menuButtons.length; i < ii; i++)
					newMenuFoot.appendChild(menuButtons[i]);
				newMenuElem.appendChild(newMenuFoot);
				return new Menu(newMenuElem, newMenuH2);
			};

			result.createMenuGroup = function (elem) {return new MenuGroup(elem);}

		})();

		// Select Groups

		(function () {

			var ISTAT = result.ISTAT;

			function SelectItem (elem, icon) {
				this.elem = elem;
				this.icon = icon;
				if (icon) elem.appendChild(icon.elem);
			}
			SelectItem.prototype.setItemImg = function (item, big) {
				this.icon.setItemImg(item, big);
			};
			SelectItem.prototype.focus      = function (b) {
				if (b) this.elem.classList.add("focus");
				else   this.elem.classList.remove("focus");
			};

			function SelectItemGroup (elem, f, x) {
				this._x         = x;    // item type
				this.elem       = elem  // HTMLElement
				this.children   = [];   // Array of type SelectItem
				this.selected   = null; // selected SelectItem
				this.clickEvent = f;    // Function to be called on onclick
				addEventHandler(elem, "click", this._handler.bind(this));
			}
			SelectItemGroup.prototype.push     = function (elem, y) {
				var icon = null;
				if (!window.isNaN(this._x))
					icon = ISTAT[this._x][y || 0].createItemIcon();
				return this.children.push(new SelectItem(elem,icon));
			};
			SelectItemGroup.prototype.insert   = function (i, elem, y) {
				var icon = ISTAT[this._x][y || 0].createItemIcon();
				this.children[i] = new SelectItem(elem, icon);
			};
			SelectItemGroup.prototype.select   = function (i) {
				if (this.selected) this.selected.focus(false);
				this.selected = this.children[i] || null;
				if (this.selected) this.selected.focus(true);
			};
			SelectItemGroup.prototype._find    = function (elem) {
				var _children = this.children;
				for (var i = 0, ii = _children.length; i < ii; i++)
					if (_children[i] && elem === _children[i].elem) return i;
				return -1;
			};
			SelectItemGroup.prototype._handler = function (e) {
				var T = e.target, i = -1;
				while (i === -1 && T !== this.elem) {
					i = this._find(T);
					T = T.parentNode;
				}
				if (i !== -1) this.clickEvent(this._x, i);
				stopEventPropagation(e);
			};
			SelectItemGroup.prototype.remove   = function (args) {
				var i = -1;
				if (args instanceof SelectItem)
					i = this.children.indexOf(args);
				if (this.children[i]) {
					if (this.selected === this.children[i])
						this.selected = null;
					this.children.splice(i, 1);
				}
			};

			function RankIcon (n, s) {
				var newDiv = document.createElement("div");
				if (s) newDiv.id = s;
				newDiv.classList.add("rank-icon");
				this.elem = newDiv;
				this.setRankImg(n);
			}
			RankIcon.prototype.setRankImg = function (n) {
				var coordY = window.Math.ceil(n / 5),
					coordX = n % 5;
				if (n !== 0) coordX -= 1;
				this.elem.style.backgroundPosition =
					(-1 * 40 * coordX) + "px " + (-1 * 60 * coordY) + "px";
			};
			RankIcon.prototype.focus      = function (b) {
				if (b) this.elem.classList.add("focus");
				else   this.elem.classList.remove("focus");
			};

			result.createSelectItemGroup = function (elem, f, x) {
				return new SelectItemGroup(elem, f, x);
			}
			result.createRankIcon        = function (n, s) {return new RankIcon(n, s);}

		})();

		// Rank Image

		(function () {

			function setRankImg (n) {
				var coordY = window.Math.ceil(n / 5),
					coordX = n % 5;
				if (n !== 0) coordX -= 1;
				this.elem.style.backgroundPosition =
					(-1 * 40 * coordX) + "px " + (-1 * 60 * coordY) + "px";
			}

			result.getRankImg = function (n,s) {
				var rankImg = {},
					newDiv  = document.createElement("div");
				if (s) newDiv.id = s;
				newDiv.classList.add("rank-icon");
				rankImg.elem = newDiv;
				rankImg.setRankImg = setRankImg;
				rankImg.setRankImg(n);
				return rankImg;
			}

		})();

		// Capacity Bars

		(function () {

			function CapacityBar () {
				this.elem = document.createElement("div");
				this.bar  = document.createElement("div");

				// init
				this.elem.classList.add("capacity");
				this.bar.classList.add("capacity-bar");
				this.elem.appendChild(this.bar);
			}
			CapacityBar.prototype.setVal = function (n, max) {
				if (window.isNaN(n) || n < 0) n = 0;
				if (n > max) {
					this.bar.style.width = "100%";
					this.bar.classList.add("over");
				}
				else {
					this.bar.style.width = (max > 0)?
						bpa.numToPercent(n / max) : "0%";
					this.bar.classList.remove("over");
				}
			};

			result.createCapacityBar = function (max) {return new CapacityBar(max);}

		})();

	})();

	//
	// Misc Utilities
	//

	(function () {

		(function () {

			function numClean (n) {
				// Removes extra decimal places
				// Expects: Number, Returns: String
				if (((n.toFixed(1) * 10) % 10) === 0) return n.toFixed(0).toString();
				else return n.toFixed(1).toString();
			};

			result.numClean     = numClean;

			result.numToPercent = function (n) {
				// Displays a decimal value as a percent
				// Expects: Number, Returns: String
				return numClean(n * 100).toString() + "%";
			};

		})();

		result.numCommas = function (n) {
			// Adds comma separators to large numbers
			// Expects: Number, Returns: String
			var x = n.toString(),
				l = window.Math.floor((x.length - 1) / 3),
				t;
			for (var i = 0; i < l; i++) {
				t = x.length - (3 * (i + 1) + i);
				x = x.slice(0, t) + "," + x.slice(t);
			}
			return x;
		};

		result.numToTime = function (n) {
			// Prints seconds in d/h/m/s format
			// Expects: Number, Returns: String
			return (
				window.Math.floor(n / 86400) + "d " +
				window.Math.floor(n % 86400 / 3600) + "h " +
				window.Math.floor(n % 3600 / 60) + "m " +
				window.Math.floor(n % 60) + "s"
			);
		};

		result.shroud    = function (b) {
			// Loading screen
			if (b) document.getElementById("shroud").classList.remove("hidden");
			else   document.getElementById("shroud").classList.add("hidden");
		};

	})();

	//
	// Initialization
	//

	(function () {

		function init () {
			initMainTabs();
			initKeyboardControls();
			//initData();
			bpa.init = null;
		}

		function initKeyboardControls() {
			bpa.addEventHandler(window, "keydown", bpa.keyControls.pressKey);
		}

		function initMainTabs () {
			var mainTabGroup = bpa.createTabGroup();

			mainTabGroup.push(
				document.getElementById("main-tab-shipyard"),
				document.getElementById("main-view-shipyard")
			);
			mainTabGroup.push(
				document.getElementById("main-tab-datatable"),
				document.getElementById("main-view-datatable")
			);
			mainTabGroup.push(
				document.getElementById("main-tab-battlemap"),
				document.getElementById("main-view-battlemap")
			);

			mainTabGroup.push(
				document.getElementById("main-tab-timeconverter"),
				document.getElementById("main-tool-timeconverter")
			);
			mainTabGroup.push(
				document.getElementById("main-tab-resources"),
				document.getElementById("main-tool-resources")
			);
			mainTabGroup.push(
				document.getElementById("main-tab-formulas"),
				document.getElementById("main-tool-formulas")
			);

			mainTabGroup.select(0);

			bpa.keyControls.addKey("Y", function () {mainTabGroup.select(0);});
			bpa.keyControls.addKey("D", function () {mainTabGroup.select(1);});
			bpa.keyControls.addKey("B", function () {mainTabGroup.select(2);});
			bpa.keyControls.addKey("T", function () {mainTabGroup.select(3);});
			bpa.keyControls.addKey("L", function () {mainTabGroup.select(4);});
			bpa.keyControls.addKey("F", function () {mainTabGroup.select(5);});

		}	

		result.init = init;

	})();

	//
	// Export
	//

	return (function () {
		var tmp = result;
		result = null;
		return tmp;
	})();

})();

//-//--0sy//
//
// SHIP YARD 
//
//-////////////////

var shipYard = (function () {

	var UI = {},
		ISTAT,
		canClickSlot = [],       // which slots are clickable
		canClickItem = [],       // which items are clickable
		selectedSlot = [-1, -1], // which slot is selected
		updateShipDataCount = 0,
		fleetData,
		selectedShipIndex,
		shipPlan;

	//
	// Initialization
	//

	function init () {

		ISTAT = bpa.ISTAT;

		function initSYViews () {
			var syViews = bpa.createTabGroup();
			syViews.push(
				document.getElementById("sy-button-list"),
				document.getElementById("sy-view-list")
			);
			syViews.push(
				document.getElementById("sy-button-graph"),
				document.getElementById("sy-view-graph")
			);
			syViews.select(0);
		}

		function initFleet () {
			var newSlot;

			fleetData = bpa.createFleetData(5);

			UI.FLEET = bpa.createSelectItemGroup(
				document.getElementById("sy-fleet"), clickShip, 0
			);

			function createShipSlot (k) {
				var newDiv  = document.createElement("div"),
					newIcon = ISTAT[0][0].createItemIcon();
				newDiv.classList.add("sy-fleet-slot");
				newDiv.classList.add("ship-icon");
				return newDiv;
			}

			// create ship slots
			for (var k = 0, kk = fleetData.plan.ships.length; k < kk; k++) {
				newSlot = createShipSlot(k);
				UI.FLEET.push(newSlot);
				UI.FLEET.elem.appendChild(newSlot);
			}

		}

		function initRank () {

			function init () {
				var newMenu = UI.MENUS.createMenu(
						createRankTable(),
						[bpa.createButton("Cancel", closeItemMenu)]
					),
					i = UI.MENUS.push(newMenu) - 1;
				newMenu.setHeader("Select Ship Rank");
				UI.MENUS.elem.appendChild(newMenu.elem);
				UI.RANK = bpa.createRankIcon(0);
				document.getElementById("sy-shiprank").appendChild(UI.RANK.elem);
				bpa.addEventHandler(UI.RANK.elem, "click", getRankSlotHandler(i));
			}

			function createRankTable () {
				var newTable  = document.createElement("div"),
					rankGroup = bpa.createSelectItemGroup(newTable,clickRank,"rank"),
					newSelectRank;
				newTable.classList.add("sy-menu-select-table");
				for (var j = 0, jj = bpa.RANK_DATA.length; j < jj; j++) {
					newSelectRank = bpa.createRankIcon(j).elem;
					rankGroup.push(newSelectRank);
					newTable.appendChild(newSelectRank);
				}
				return newTable;
			}

			init();

		}

		function initSlots () {
			var colNames = [
					"sy-list-col-hull",
					"sy-list-col-weap",
					"sy-list-col-armr",
					"sy-list-col-spec",
					"sy-list-col-tact"
				],
				newItemSlot;

			function init () {
				UI.SLOTS = [];
				UI.OUT   = [];

				initShipOut ();
				UI.SLOTS.push(
					bpa.createSelectItemGroup(
						document.getElementById(colNames[0]), clickSlot, 0
					)
				);
				UI.OUT.push([]);
				newItemSlot = createItemSlot(0,0);
				UI.SLOTS[0].push(newItemSlot);
				UI.SLOTS[0].elem.appendChild(newItemSlot);

				for (var i = 1, ii = PTYPE.S.length; i < ii; i++) {
					UI.SLOTS.push(
						bpa.createSelectItemGroup(
							document.getElementById(colNames[i]), clickSlot, i
						)
					);
					UI.OUT.push([]);
					for (var j = 0, jj = PTYPE.S[i]; j < jj; j++) initListItem(i, j);
				}

			}

			function initShipOut () {
				//	document.getElementById("sy-shipdata-12"),
				UI.SHIP_OUT = {
					BASIC : [
						document.getElementById("sy-shipdata-s1"),
						document.getElementById("sy-shipdata-s2"),
						document.getElementById("sy-shipdata-s3"),
						document.getElementById("sy-shipdata-s4")
					],
					MOVEMENT : [
						document.getElementById("sy-shipdata-m1"),
						document.getElementById("sy-shipdata-m2"),
						document.getElementById("sy-shipdata-m3"),
						document.getElementById("sy-shipdata-m4")
					],
					SUB : [
						document.getElementById("sy-shipdata-u1"),
						document.getElementById("sy-shipdata-u2"),
						document.getElementById("sy-shipdata-u3")
					],
					DEF_B : [
						document.getElementById("sy-shipdata-d1"),
						document.getElementById("sy-shipdata-d2"),
						document.getElementById("sy-shipdata-d3"),
						document.getElementById("sy-shipdata-d4"),
						document.getElementById("sy-shipdata-d5")
					],
					TOTAL : [
						document.getElementById("sy-shipdata-t1"),
						document.getElementById("sy-shipdata-t2"),
						document.getElementById("sy-shipdata-t3")
					],
					MISC : [
						document.getElementById("sy-shipdata-o1")
					],
					WEIGHT : [
						document.getElementById("sy-shipdata-w1"),
						document.getElementById("sy-shipdata-w2")
					],
					BUILD : [
						document.getElementById("sy-shipdata-b1"),
						document.getElementById("sy-shipdata-b2"),
						document.getElementById("sy-shipdata-b3"),
						document.getElementById("sy-shipdata-b4"),
						document.getElementById("sy-shipdata-b5")
					],
					REPAIR : [
						document.getElementById("sy-shipdata-r1"),
						document.getElementById("sy-shipdata-r2"),
						document.getElementById("sy-shipdata-r3"),
						document.getElementById("sy-shipdata-r4"),
						document.getElementById("sy-shipdata-r5"),
						document.getElementById("sy-shipdata-r6")
					]					
				};
			}

			function initListItem (i, j) {
				var newListItem = document.createElement("div"),
					newListSlot = document.createElement("div"),
					newListData = document.createElement("div"),
					newItemSlot = createItemSlot(i, j);
				newListItem .classList.add("sy-list-item");
				newListSlot .classList.add("sy-list-slot");
				newListData .classList.add("sy-list-data");
				newListItem .appendChild(newListSlot);
				newListItem .appendChild(newListData);
				newListSlot .appendChild(newItemSlot);
				newListData .appendChild(createItemData(i, j));
				UI.SLOTS[i] .push(newItemSlot);
				UI.SLOTS[i] .elem.appendChild(newListItem);
			}

			function createItemSlot (i, j) {
				var s = PTYPE.T[i] + " Slot " + (j + 1),
					newItemSlot = document.createElement("div");
				newItemSlot.classList.add("sy-item-slot");
				newItemSlot.classList.add(PTYPE.C[i]);
				newItemSlot.title = s;
				newItemSlot.alt   = s;
				return newItemSlot;
			}

			function createItemOut () {
				var newSpan = document.createElement("span");
				newSpan.classList.add("text-yellow");
				return newSpan;
			}

			function createItemData (i, j) { // creates info display for a slot
				var t = PTYPE.T[i],
					newItemData = document.createElement("div"),
					newH3    = document.createElement("h3"),
					newRowH  = document.createElement("p"),
					newRow1  = document.createElement("p"),
					newRow2  = document.createElement("p"),
					newWtTag = document.createTextNode("Wt:"),
					newWtOut = createItemOut(),
					newBonus = document.createElement("div");

				newItemData.classList.add("sy-item-data");
				newRowH.appendChild(newH3);
				newItemData.appendChild(newRowH);
				newBonus.classList.add("text-blue");

				switch (i) {
					case 1:
						var newRngTag     = document.createTextNode("Rng:");
						var newMinRngSpan = document.createElement("span");
						var newRng1Out    = createItemOut();
						newMinRngSpan.appendChild(newRng1Out);
						newMinRngSpan.appendChild(document.createTextNode("~"));
						var newRng2Out = createItemOut();
						newRow1.appendChild(newRngTag);
						newRow1.appendChild(newMinRngSpan);
						var newDmgTag = document.createTextNode("DPS:");
						var newDmgOut = createItemOut();
						newRow1.appendChild(newRng2Out);
						newRow1.appendChild(newDmgTag);
						newRow1.appendChild(newDmgOut);
						newRow1.appendChild(newWtTag);
						newRow1.appendChild(newWtOut);
						newRow2.appendChild(newBonus);
						UI.OUT[i].push({
							table : newItemData,
							name  : newH3,
							rngMn : newMinRngSpan,
							rng1  : newRng1Out,
							rng2  : newRng2Out,
							dmg   : newDmgOut,
							wt    : newWtOut,
							bon   : newBonus
						});
						break;
					case 2:
						var newArmTag = document.createTextNode("Armr:"),
							newArmOut = createItemOut();
						newRow1.appendChild(newArmTag);
						newRow1.appendChild(newArmOut);
						newRow1.appendChild(newWtTag);
						newRow1.appendChild(newWtOut);
						newRow2.appendChild(newBonus);
						UI.OUT[i].push({
							table : newItemData,
							name  : newH3,
							arm   : newArmOut,
							wt    : newWtOut,
							bon   : newBonus
						});
						break;
					case 3:
						newRow1.appendChild(newWtTag);
						newRow1.appendChild(newWtOut);
						newRow2.appendChild(newBonus);
						UI.OUT[i].push({
							table : newItemData,
							name  : newH3,
							wt    : newWtOut,
							bon   : newBonus
						});
						break;
					case 4:
						var newRngTag = document.createTextNode("Rng:");
						var newRngOut = createItemOut();
						newRow1.appendChild(newRngTag);
						newRow1.appendChild(newRngOut);
						var newArmTag = document.createTextNode("Armr:");
						var newArmOut = createItemOut();
						newRow1.appendChild(newArmTag);
						newRow1.appendChild(newArmOut);
						newRow1.appendChild(newWtTag);
						newRow1.appendChild(newWtOut);
						newRow2.appendChild(newBonus);
						var newFoE = createItemOut();
						newRow2.appendChild(newFoE);
						UI.OUT[i].push({
							table : newItemData,
							name  : newH3,
							arm   : newArmOut,
							rng   : newRngOut,
							foe   : newFoE,
							wt    : newWtOut,
							bon   : newBonus
						});
						break;
				}

				newItemData.appendChild(newRow1);
				newItemData.appendChild(newRow2);

				return newItemData;
			}

			init();

		}

		function initItemMenus () { // also inits menu items

			var itemArray = [
				[
					[[[1000,1001,1002,1003,1004,1005,1006,1007]],[[1100,1101]],[[1200,1201]],[[1300]],[[1400]],[[1500]]],
					[[[null,null,null,null,1014,1015,1016,1017]],[[null,1111]],[[null,null]],[[1310]],[[1401]],[[1501]]],
					[[[null,null,null,null,null,null,1026,1027]],[[null,null]],[[null,null]],[[null]],[[1402]],[[null]]],
					[[[null,null,null,null,null,1055,1056,1057]],[[1150,1151]],[[null,1250]],[[1350]],[[1403]],[[1502]]],
					[[[null,null,null,null,null,null,null,null]],[[null,1161]]],
					[[[1600,1601,1610,1611]]],
					[[[2000,2001,2002,2003,2004,2005,2006,2007]],[[2100,2101]],[[2200,2201]],[[2300]],[[2400]]],
					[[[null,null,2012,2013,2014,null,2016,2017]],[[2110,null]],[[2210,null]]],
					[[[null,null,2022,null,null,null,2026,null]],[[null,2121]],[[null,null]]],
					[[[2600,2620,2601]]],
					[[[3006,3016,3007]]]
				],
				[
					[[[1100,1101,1102,1103],[1110,1111,1112,1113],[1120,1121,1122],[1130,1131,1132]],[[2100,2101,2102,2103],[2110,2111,2112,2113],[2120,2121,2122,2123,2124],[2130]],[[3100,3101,3102]]],
					[[[1200,1201,1202,1203],[1210,1211,1212,1213],[1220,1221,1222],[]              ],[[2200,2201,2202,null],[2210,2211,2212,null],[2220,2221,2222,2223]],[[3200,3201,3202]]],
					[[[1300,1301,1302,1303],[1310,1311,1312,1313],[1320,1321,1322],[]              ],[[2300,2301,2302,2303],[2310,2311,2312,2313],[2320,2321,2322,2323]],[[3300]]],
					[[[1400,1401,1402,1403],[1410,1411,1412,1413],[1414]                           ],[[2400,2401,2402,2403],[2410,2411,2412,2413],[2420,2421,2422,2423]],[[3400]]],
					[[[1500,1501,1502,1503],[null,null,null,null],[1520,1521,1522],[1530,1531,1532]],[[2500,2501,2502,null],[2510,2511,2512,2513],[2520,2521,2522]]],
					[[[1600,1601,1602,1603],[null,null,null,null],[1620,1621,1622],[]              ],[[2600,2601,2602]]],
					[[[1700,1701]],[[2800,2801,2802]]]
				],
				[
					[[[1000,1001,1002,1003]],[[2000,2001,2002]]],
					[[[1010,1011,1012,1013]],[[2010,2011,2012],[2013,2014,2015,2016],[2017,2018,2019]]],
					[[[1020,1021,1022,1023]],[[2020,2021,2022],[2023,2024,2025,2026],[null,2028,2029]]],
					[[[1030,1031,1032,1033]],[[2030,2031,2032],[2033,2034,2035,2036],[null,2038,2039]]]
				],
				[
					[[[1000,1001,1002],[1010,1011,1012],[1020,1021,1022]],[[2000,2001,2002],[2010,2011,2012],[2020,2021,2022],[2030,2031,2032]]],
					[[[1100,1101,1102],[1110,1111,1112],[1120,1121,1122],[1130,1131,1132]],[[2100,2101,2102]]],
					[[[1200,1201,1202],[1210,1211,1212],[1220,1221,1222],[1230,1231,1232],[1260,1261,1262]],[[2200,2201,2202]]],
					[[[1300,1301,1302],[1310,1311,1312],[2320,2321,2322],[1330,1331,1332]]],
					[[[              ],[1410,1411,1412],[1420,1421,1422],[1430,1431,1432]]],
					[[[1500,1501,1502],[1510,1511,1512],[1520,1521,1522],[1530,1531,1532]]],
					[[[1600,1601,1602],[1610,1611,1612],[],[]]]
				],
				[
					[[[1000,1001,1002],[1010,1011,1012],[1020,1021,1022]]],
					[[[1030,1031,1032],[1040,1041,1042],[1050,1051,1052]]],
					[[[2000,2001,2002]]]
				]
			];

			function init () {
				UI.ITEMS = [];
				for (var i = 0, ii = PTYPE.S.length; i < ii; i++) {
					var newMenu = UI.MENUS.createMenu(
						createItemTable(i),
						[
							bpa.createButton("Clear" , getClearItemHandler(i)),
							bpa.createButton("Cancel", closeItemMenu)
						]
					);
					UI.ITEM_MENUS.push(UI.MENUS.push(newMenu) - 1);
					UI.MENUS.elem.appendChild(newMenu.elem);
				}
			}

			function createItemTable (i) {
				var newTable = document.createElement("div");
				newTable.classList.add("sy-menu-select-table");
				UI.ITEMS.push(
					bpa.createSelectItemGroup(newTable, clickItem, i)
				);
				for (var j = 0, jj = itemArray[i].length; j < jj; j++)
					newTable.appendChild(createItemRow(i, itemArray[i][j]));
				return newTable;
			}

			function createItemRow (i, a) {
				var newRow = document.createElement("div"),
					newBlock;
				newRow.classList.add("sy-menu-select-row");
				for (var j = 0, jj = a.length; j < jj; j++)
					newRow.appendChild(createItemCol(i, a[j]));
				return newRow;
			}

			function createItemCol (i, a) {
				var newCol = document.createElement("div"),
					newBlock;
				newCol.classList.add("sy-menu-select-col");
				for (var j = 0, jj = a.length; j < jj; j++)
					newCol.appendChild(createItemBlock(i, a[j]));
				return newCol;
			}

			function createItemBlock (i, a) {
				var newBlock = document.createElement("div");
				newBlock.classList.add("sy-menu-select-block");
				for (var j = 0, jj = a.length; j < jj; j++)
					newBlock.appendChild(createSelectItem(i, a[j]));
				return newBlock;
			}

			function createSelectItem (i, a) {
				if (a === null) return createPlaceHolder()
				else            return createSelectItemIcon(i, a);
			}

			function createPlaceHolder () {
				var newDiv = document.createElement("div");
				newDiv.classList.add("placeholder-icon");
				return newDiv;
			}

			function createSelectItemIcon (i, a) {
				var y = ISTAT.getIndexById(i, a), // ENSURES: menu items match ISTAT order
					newSelectItem = document.createElement("div"),
					newItemCover  = document.createElement("div");
				newSelectItem.classList.add("sy-menu-select-item");
				newItemCover.classList.add("cover-dark");
				UI.ITEMS[i].insert(y, newSelectItem, y);
				newSelectItem.appendChild(newItemCover);
				UI.ITEMS[i].elem.appendChild(newSelectItem);
				return newSelectItem;
			}

			init();

		}

		function initRetrofit () {

			var hasRetrofit;

			function init () {
				initHasRetrofit();
				initMenu();
			}

			function initHasRetrofit () {
				hasRetrofit = [];
				for (var i = 0, ii = bpa.RETROFIT_DATA.length; i < ii; i++) {
					hasRetrofit.push([]);
					for (var j = 0, jj = bpa.RETROFIT_DATA[i].length; j < jj; j++)
						hasRetrofit[i].push(-1);
				}
			}

			function initMenu () {
				var newMenu = UI.MENUS.createMenu(
						createMenuBox(),
						[bpa.createButton("Close", UI.MENUS.close.bind(UI.MENUS))]
					),
					i = UI.MENUS.push(newMenu) - 1;
				newMenu.setHeader("Retrofit Options");
				bpa.addEventHandler(
					document.getElementById("sy-button-retrofit"),
					"click",
					UI.MENUS.open.bind(UI.MENUS, i)
				);
				UI.MENUS.elem.appendChild(newMenu.elem);
			}

			function createMenuBox () {
				var newMenuBox = document.createElement("div"), newH3;
				for (var i = 0, ii = bpa.RETROFIT_DATA.length; i < ii; i++) {
					newMenuBox.appendChild(document.createElement("hr"));
					newH3 = document.createElement("h3");
					newH3.appendChild(document.createTextNode(PTYPE.T[i]+"s"));
					newMenuBox.appendChild(newH3);
					for (var j = 0, jj = bpa.RETROFIT_DATA[i].length; j < jj; j++)
						newMenuBox.appendChild(createRetroBlock(i, j));
				}
				return newMenuBox;
			}

			function createRetroBlock (i,j) {
				var RETROFIT  = bpa.RETROFIT_DATA[i][j],
					newBlock  = document.createElement("div"),
					newP      = document.createElement("p"),
					newSelect = document.createElement("select"),
					newOption;
				newBlock.classList.add("sy-retro-block");
				newP.appendChild(document.createTextNode(RETROFIT.name));
				newBlock.appendChild(newP);
				for (var k = 0, kk = RETROFIT.retrofits.length + 1; k < kk; k++) {
					newOption = document.createElement("option");
					newOption.value = k;
					newOption.appendChild(document.createTextNode(k));
					newSelect.appendChild(newOption);
				}
				bpa.addEventHandler(newSelect, "change", getRetroSelectHandler(i, j));
				newBlock.appendChild(newSelect);
				return newBlock;
			}

			function getRetroSelectHandler (i, j) {
				return function () {
					hasRetrofit[i][j] = parseInt(this.value) - 1;
					fleetData.setRetrofits(hasRetrofit);
					updateShipData();
				};
			}

			init();

		}

		function initShipSaveMenu () {
			var shipSaveManagerInstance = shipSaveManager.create(),
				newMenu = UI.MENUS.createMenu(
					shipSaveManagerInstance.elem,
					[
						bpa.createButton("Load",   getLoadShipHandler(shipSaveManagerInstance)),
						bpa.createButton("Save",   shipSaveManager.newShip),
						bpa.createButton("Copy",   shipSaveManagerInstance.copyShip),
						bpa.createButton("Name",   shipSaveManagerInstance.nameShip),
						bpa.createButton("Delete", shipSaveManagerInstance.deleteShip),
						bpa.createButton("Clear",  shipSaveManager.clearShips),
						bpa.createButton("Close",  UI.MENUS.close.bind(UI.MENUS))
					]
				),
				i = UI.MENUS.push(newMenu) - 1;
			newMenu.setHeader("Save Ships");
			bpa.addEventHandler(
				document.getElementById("sy-button-shipsave"),
				"click",
				UI.MENUS.open.bind(UI.MENUS, i)
			);
			UI.MENUS.elem.appendChild(newMenu.elem);
		}

		function initUI () {

			initSYViews();

			UI.ITEM_MENUS = [];
			UI.MENUS = bpa.createMenuGroup(document.getElementById("sy-view-menu"));

			initFleet();
			initRank();

			UI.SHIP_MODS = document.getElementById("sy-shipdata-mods");

			initSlots();
			initItemMenus();
			initRetrofit();

			initShipSaveMenu();

			UI.SHIP_WEIGHT = bpa.createCapacityBar();
			document.getElementById("sy-ship-weight").appendChild(UI.SHIP_WEIGHT.elem);

			UI.FLEET_DATA  = {
				WEIGHT : [
					document.getElementById("sy-fleetdata-w1"),
					document.getElementById("sy-fleetdata-w2")
				]
			};

			//UI.FLEET_WEIGHT = document.getElementById("sy-fleet-weight");
			UI.FLEET_WEIGHT = bpa.createCapacityBar();
			document.getElementById("sy-fleet-weight").appendChild(UI.FLEET_WEIGHT.elem);

			initHandlers();

		}

		function initClickStates () {
			for (var i = 0, ii = PTYPE.S.length; i < ii; i++) {
				canClickSlot.push([]);
				for (var j = 0, jj = PTYPE.S[i]; j < jj; j++) canClickSlot[i].push(false);
				canClickItem.push([]);
				for (var j = 0, jj = ISTAT[i].length; j < jj; j++) canClickItem[i].push(true);
			}
			canClickSlot[0][0] = true;
		}

		function initState () {
			initClickStates();
			setShipSlot(0);
			resetShip();
		}

		initUI();
		initState();

		shipYard.init = null;

		//console.log(UI);

	}

	function initHandlers () {
		bpa.addEventHandler(
			document.getElementById("sy-officer-fsp"),
			"change",
			function () {fleetData.plan.officers.fsp = this.checked; updateShipData();}
		);
		bpa.addEventHandler(
			document.getElementById("sy-officer-bt"),
			"change",
			function () {fleetData.plan.officers.bt  = this.checked; updateShipData();}
		);
		bpa.addEventHandler(
			document.getElementById("sy-officer-rt"),
			"change",
			function () {fleetData.plan.officers.rt  = this.checked; updateShipData();}
		);
		bpa.addEventHandler(
			document.getElementById("sy-shipyard-level"),
			"change",
			function () {fleetData.setYardLevel(Number(this.value)); updateShipData();}
		);
		bpa.addEventHandler(
			document.getElementById("sy-dock-level"),
			"change",
			function () {fleetData.dockLevel = Number(this.value); updateFleetData();}
		);
		bpa.addEventHandler(
			document.getElementById("sy-reset-fleet"), "click", resetAll
		);
		bpa.addEventHandler(
			document.getElementById("sy-reset-ship") , "click", resetShip
		);
		bpa.addEventHandler(
			document.getElementById("sy-button-row"),
			"click",
			(function () {
				var listView = document.getElementById("sy-view-list");
				return function () {listView.classList.toggle("row");};
			})()
		);
	}

	//
	// Event Handlers
	//

	function clickShip (x, k) {setShipSlot(k);}

	function clickSlot (x, s) {
		if (canClickSlot[x][s]) {
			UI.SLOTS[x].select(s);
			UI.SLOTS[x].selected.focus(true);
			closeItemMenu();
			selectedSlot = [x, s];
			openItemMenu(x);
		}
	}

	function clickItem (x, y) {
		if (canClickItem[x][y]) {
			shipPlan.setItem(x, y, selectedSlot[1]);
			if (x === 0) updateItemSlots();
			closeItemMenu();
			updateShipData();
		}
	}

	function clickRank (x, n) {setShipRank(n); UI.MENUS.close(); updateShipData();}

	function getLoadShipHandler (shipSaveManagerInstance) {
		return function () {
			setShipPlan(shipSaveManagerInstance.selectedShip());
			UI.MENUS.close();
		};
	}

	function getClearItemHandler (x) {return function () {clickItem(x, 0);};}

	function getRankSlotHandler (i) {return function () {UI.MENUS.open(i);};}

	//
	// Ship Plan
	//

	function setShipRank (n) {shipPlan.setRank(n); updateShipData(); closeItemMenu();}

	function setShipSlot (k) { // UI func
		if (UI.FLEET.selected) UI.FLEET.selected.focus(false);
		UI.FLEET.select(k);
		UI.FLEET.selected.focus(true);
		UI.FLEET.selected.setItemImg(fleetData.plan.ships[k].slotVals[0][0]);
		shipPlan = fleetData.plan.ships[k];
		selectedShipIndex = k;
		updateItemSlots();
		updateShipData();
		closeItemMenu();
	}

	function resetShip () {
		shipPlan.setRank(0);
		shipPlan.setItem(0,0,0);
		updateItemSlots();
		updateShipData();
		closeItemMenu();
	}

	function resetAll () {
		var shipPlans = fleetData.plan.ships;
		for (var k = 0, kk = shipPlans.length; k < kk; k++) {
			shipPlans[k].setRank(0);
			shipPlans[k].setItem(0,0,0);
			UI.FLEET.children[k].setItemImg(ISTAT[0][0]);
		}
		setShipSlot(0);
	}

	//
	// User Interface
	//

	function openItemMenu (x) {		
		var y = selectedSlot[1],
			j = ISTAT.getIndexById(x, shipPlan.slotVals[x][y].id);
		bestCalculator.close();
		UI.MENUS.open(UI.ITEM_MENUS[x]);
		UI.MENUS.selected.setHeader(
			"Select " + PTYPE.T[x] + ((x === 0)? "" : " for Slot " + (y + 1))
		);
		if (UI.ITEMS[x].selected) UI.ITEMS[x].selected.focus(false);
		UI.ITEMS[x].select(j);
		if (j !== 0) UI.ITEMS[x].selected.focus(true);
		if (x === 1) weaponMenuBlock();
		else if (x === 3) specialMenuBlock();		
	}

	function closeItemMenu () {
		var x = selectedSlot[0];
		UI.MENUS.close();
		if (UI.SLOTS[x] && UI.SLOTS[x].selected) UI.SLOTS[x].selected.focus(false);
	}

	function itemBlock (selectItem, b) {
		if (b) selectItem.elem.classList.add("block");
		else   selectItem.elem.classList.remove("block");
	}

	function weaponMenuBlock () { // REQUIRES: menu items match ISTAT order
		var W_LIST = UI.ITEMS[1].children,
			wST    = shipPlan.slotVals[0][0].wSlots[selectedSlot[1]],
			hull   = shipPlan.slotVals[0][0],
			b;
		for (var i = 1, ii = ISTAT[1].length; i < ii; i++) {
			b = hull.isValidWeapon(selectedSlot[1], ISTAT[1][i]);
			if (W_LIST[i]) itemBlock(W_LIST[i], !b);
			else console.log("Error: Missing Item at " + i);
			canClickItem[1][i] = b;
		}
	}

	function specialMenuBlock () {
		var s      = selectedSlot[1],
			S_LIST = UI.ITEMS[3].children,
			m,
			_iSpec1,
			_iSpec2,
			_iBonuses,
			_iBonuses2;
		for (var i = 1, ii = ISTAT[3].length; i < ii; i++) { // items
			m = true;
			_iSpec1   = ISTAT[3][i];
			_iBonuses = _iSpec1.sMods;
			for (var j in _iBonuses) {if (_iBonuses.hasOwnProperty(j)) {
				if (j === "wtTot" || j === "wtWpn" || j === "wtAmr" || j === "wtTct") continue;
				for (var k = 0, kk = shipPlan.slotVals[0][0].slots[3]; k < kk; k++) { // slot choices
					if (k === s) continue;
					_iSpec2    = shipPlan.slotVals[3][k];
					_iBonuses2 = _iSpec2.sMods;
					for (var l in _iBonuses2) {if (_iBonuses2.hasOwnProperty(l)) { // slot choice bonuses
						if (
							(j !== "evd" && j === l) ||
							(j === "evd" && _iSpec1.name.slice(0,7) === _iSpec2.name.slice(0,7)) ||
							(
								(j === "dfB" || j === "dfP" || j === "dfE" || j === "dfC") &&
								(l === "dfB" || l === "dfP" || l === "dfE" || l === "dfC")
							)
						)
							{m=false; break;}
					} }
				}
			} }
			canClickItem[3][i] = m;
			if (S_LIST[i]) itemBlock(S_LIST[i], !m);
			else console.log("Error: Missing Item at " + i);
		}
	}

	//
	// Update Functions
	//

	function writeData(elem, s, a, b) {
		var newSpan = document.createElement("span");
		newSpan.appendChild(document.createTextNode(s));
		if (a > b)      newSpan.classList.add("text-green");
		else if (a < b) newSpan.classList.add("text-red");

		if (elem.firstChild) elem.removeChild(elem.firstChild);
		elem.appendChild(newSpan);
	}

	function updateItemSlots() {
		var hull = shipPlan.slotVals[0][0],
			u,
			_iSlot;
		UI.FLEET.selected.setItemImg(shipPlan.slotVals[0][0]);
		for (var i = 1, ii = PTYPE.S.length; i < ii; i++) {
			for (var j = 0, jj = PTYPE.S[i]; j < jj; j++) {
				_iSlot = UI.SLOTS[i].children[j].elem;
				u = (i === 1)? hull.wSlots[j] : 0;
				if (!(j < hull.slots[i])) u = -1;

				// set slot style for weapon slots
				if (i === 1) {
					_iSlot.classList.remove("deck");
					_iSlot.classList.remove("both");
					_iSlot.classList.remove("undr");
					_iSlot.classList.remove("air");
					switch (u) {
						case 0: _iSlot.classList.add("deck"); break;
						case 1: _iSlot.classList.add("both"); break;
						case 2: _iSlot.classList.add("undr"); break;
						case 3: _iSlot.classList.add("air");  break;
					}
				}

				// set usable slots
				canClickSlot[i][j] = u!==-1;
				if (canClickSlot[i][j]) {
					_iSlot.classList.remove("hidden");
					UI.OUT[i][j].table.classList.remove("hidden");
				}
				else {
					_iSlot.classList.add("hidden");
					UI.OUT[i][j].table.classList.add("hidden");
				}
			}
		}
	}

	function updateShipData() {
		var shipStat;

		fleetData.setShip(selectedShipIndex, shipPlan);
		shipStat = fleetData.stat.ships[selectedShipIndex];
		
		updateSlotImages();
		updateItemData(shipStat);
		updateHullData(shipStat);
		updateShipModifiers(shipStat);
		updateFleetData();

		updateShipDataCount++;
		//console.log("updateShipData invoked " + updateShipDataCount+" times");

		grapher.updateGraphs(shipStat);
	}

	function updateSlotImages() {
		var _uiSlotsChildren;

		// Updates item slot images
		UI.RANK.setRankImg(shipPlan.shipRank);
		UI.SLOTS[0].children[0].setItemImg(shipPlan.getItem(0,0), true);
		for (var i = 1, ii = PTYPE.S.length; i < ii; i++) {
			_uiSlotsChildren = UI.SLOTS[i].children;
			for (var j = 0, jj = PTYPE.S[i]; j < jj; j++)
				_uiSlotsChildren[j].setItemImg(shipPlan.getItem(i,j));
		}
	}

	function updateItemData(shipStat) {
		var hull = shipStat.plan.slotVals[0][0],
			_item, _out, mR, mD;

		// Updates item stat data
		for (var i = 1, ii = hull.slots.length; i < ii; i++) {
			for (var j = 0, jj = hull.slots[i]; j < jj; j++) {
				_item = shipPlan.getItem(i,j);
				_out  = UI.OUT[i][j];
				writeData(_out.name, _item.name);
				switch (i) {
					case 1 :
						// range
						mR = shipStat.getPRng(_item, fleetData);
						if (_item.minRng===0) _out.rngMn.classList.add("hidden");
						else _out.rngMn.classList.remove("hidden");
						writeData(_out.rng1, _item.minRng);
						writeData(_out.rng2, bpa.numClean(mR), mR, _item.maxRng);
						// dps / cps
						if (_item.wType !== kWT.DEFS) {
							mD = shipStat.getPDPS(_item, fleetData);
							writeData(_out.dmg , bpa.numClean(mD), mD, _item.getDPS(kDT.SHIP, kDT.NON));
						}
						else {
							mD = shipStat.getPCPS(_item, fleetData);
							writeData(_out.dmg, "(" + bpa.numClean(mD) + ")", mD, _item.getCPS());
						}
						break;
					case 2 :
						writeData(_out.arm, _item.armor);
						break;
					case 3 :
						break;
					case 4 :
						writeData(_out.rng, _item.range);
						writeData(_out.arm, _item.armor);
						writeData(_out.foe, _item.foe.print());
						break;
				}
				writeData(_out.wt, _item.weight);
				writeData(
					_out.bon,
					_item.sMods.print(i < 2) + ((_item.pMods)? _item.pMods.print() : "")
				);
			}
		}
	}

	function updateHullData (shipStat) {
		var hull  = shipPlan.slotVals[0][0],
			_sOut = UI.SHIP_OUT;

		// Basic info
		writeData(_sOut.BASIC[0], hull.name);
		writeData(
			_sOut.BASIC[1],
			(hull.refit)? "This Ship can be refitted." : "Not refittable."
		);
		writeData(
			_sOut.BASIC[2],
			(hull.hasWSlotType(1) || hull.hasWSlotType(2))? "Yes" : "No"
		);
		writeData(
			_sOut.BASIC[3],
			(hull.hasWSlotType(3))? "Yes" : "No"
		);

		// Submarine combat
		writeData(
			_sOut.SUB[0],
			shipStat.detectRng.toString(),
			shipStat.detectRng,
			hull.sonarRng
		);
		writeData(
			_sOut.SUB[1],
			bpa.numClean(shipStat.surfaceTime) + "s",
			shipStat.surfaceTime,
			hull.sMods.getVal("tSrf")
		);
		writeData(
			_sOut.SUB[2],
			bpa.numClean(shipStat.cloakTime) + "s",
			shipStat.cloakTime,
			hull.sMods.getVal("tClk")
		);

		// Movement and evade
		writeData(
			_sOut.MOVEMENT[0], bpa.numClean(shipStat.mSpeed), shipStat.mSpeed, hull.mSpeed
		);
		writeData(
			_sOut.MOVEMENT[1], bpa.numClean(shipStat.cSpeed), shipStat.cSpeed, hull.cSpeed
		);
		writeData(
			_sOut.MOVEMENT[2], bpa.numClean(shipStat.tSpeed), shipStat.tSpeed, hull.tSpeed
		);
		writeData(
			_sOut.MOVEMENT[3], bpa.numToPercent(1-shipStat.evade), hull.evade, shipStat.evade
		);

		// Defense bonuses
		writeData(_sOut.DEF_B[0], bpa.numToPercent(shipStat.defB), shipStat.defB, 0);
		writeData(_sOut.DEF_B[1], bpa.numToPercent(shipStat.defP), shipStat.defP, 0);
		writeData(_sOut.DEF_B[2], bpa.numToPercent(shipStat.defE), shipStat.defE, 0);
		writeData(_sOut.DEF_B[3], bpa.numToPercent(shipStat.defC), shipStat.defC, 0);
		writeData(_sOut.DEF_B[4], bpa.numToPercent(shipStat.defU), shipStat.defU, 0);

		// Misc		
		writeData(_sOut.MISC[0], shipStat.cargo.toString(), shipStat.cargo, hull.cargo);

		// Ship totals
		writeData(
			_sOut.TOTAL[0],
			bpa.numClean(shipStat.getDPS(kDT.SHIP, kDT.NON, null, fleetData))
		);
		writeData(
			_sOut.TOTAL[1],
			bpa.numClean(shipStat.getDPS(kDT.BLDG, kDT.NON, null, fleetData))
		);
		writeData(_sOut.TOTAL[2], shipStat.armor);

		// Weight
		writeData(_sOut.WEIGHT[0], shipStat.weight);
		writeData(_sOut.WEIGHT[1], hull.weight);
		UI.SHIP_WEIGHT.setVal(shipStat.weight, hull.weight);

		// Repair time
		var rTime = shipStat.rCost[0];
		writeData(_sOut.REPAIR[0], bpa.numToTime(rTime));
		for (var i = 1; i <= 4; i++)
			writeData(_sOut.REPAIR[i], bpa.numCommas(shipStat.rCost[i]));
		writeData(_sOut.REPAIR[5], (shipStat.rCost[0]<=300)? "Yes" : "No");
		
		// Build cost
		writeData(_sOut.BUILD[0], shipStat.bCost.printTime())
		for (var i = 1; i <= 4; i++)
			writeData(_sOut.BUILD[i], bpa.numCommas(shipStat.bCost[i]));

	}

	function updateShipModifiers(shipStat) {
		var MODS  = shipStat.mods,
			TBODY = document.getElementById("sy-shipdata-mods"),
			newTr, newTd;
		while(TBODY.firstChild) TBODY.removeChild(TBODY.firstChild);
		for (var i in MODS)
			if (
				MODS.hasOwnProperty(i) &&
				(MODS.getVal(i) !== MODS[i]._mType.defVal) &&
				!(
					i==="msp" || i==="msp_f" || i==="csp" || i==="tsp" || i==="evd" ||
					i==="crg" || i==="arm" ||
					i==="dfB" || i==="dfP" || i==="dfE" || i==="dfC" || i==="dfU" ||
					i==="snr" || i==="tSrf" || i==="tClk" || i==="mClk" ||
					i==="tBld" || i==="tRpr"
				)
			)
				{
				newTr = document.createElement("tr");
				newTd = document.createElement("td");
				newTd.appendChild(document.createTextNode(MODS[i].getName()+":"));
				newTr.appendChild(newTd);
				newTd = document.createElement("td");
				newTd.appendChild(document.createTextNode(MODS[i].getStat()));
				newTr.appendChild(newTd);
				TBODY.appendChild(newTr);
			}
	}

	function updateFleetData() {
		//writeData(_sOut.WEIGHT[0], YSP.weight, hull.weight, YSP.weight);
		var fleetWt = fleetData.stat.weight,
			dockWt  = bpa.DOCK_DATA[fleetData.dockLevel];
		writeData(UI.FLEET_DATA.WEIGHT[0], fleetWt);
		writeData(UI.FLEET_DATA.WEIGHT[1], dockWt);
		UI.FLEET_WEIGHT.setVal(fleetWt, dockWt);
	}

	//
	// Public Methods
	//

	function getShipPlan() {
		return bpa.createShipPlan(
			shipPlan.slotVals,
			shipPlan.shipRank
		);
	}

	function getShipStat() {
		return bpa.createShipStat(getShipPlan());
	}

	function setShipPlan(newShipPlan) {
		shipPlan.swap(newShipPlan);
		updateItemSlots();
		updateShipData();
	}

	//
	// Export
	//

	return {
		init           : init,
		closeItemMenu  : closeItemMenu,
		setShipPlan    : setShipPlan,
		getShipPlan    : getShipPlan,
		getShipStat    : getShipStat,
		updateShipData : updateShipData
	};

})();

//-//--0gd//
//
// GRAPH DISPLAY
//
//-////////////////

var grapher = (function () {

	var UI = {},
		ISTAT,
		DT_0 = [kDT.SHIP, kDT.BLDG],
		DT_1 = [kDT.NON, kDT.BAL, kDT.PEN, kDT.EXP, kDT.CNC],
		DT_N = ["NON", "BAL", "PEN", "EXP", "CNC"],
		DTAG = ["B", "P", "E", "C", "D"];

	//
	// Initialization
	//

	function init() {
		ISTAT = bpa.ISTAT;
		initUI();
		grapher.init = null;
	}

	function initUI() {
		UI.DPSBARS = {
			NON : {
				0 : document.getElementById("graph-dps-NON-0"),
				1 : document.getElementById("graph-dps-NON-1")
			},
			BAL : {
				0 : document.getElementById("graph-dps-BAL-0"),
				1 : document.getElementById("graph-dps-BAL-1")
			},
			PEN : {
				0 : document.getElementById("graph-dps-PEN-0"),
				1 : document.getElementById("graph-dps-PEN-1")
			},
			EXP : {
				0 : document.getElementById("graph-dps-EXP-0"),
				1 : document.getElementById("graph-dps-EXP-1")
			},
			CNC : {
				0 : document.getElementById("graph-dps-CNC-0"),
				1 : document.getElementById("graph-dps-CNC-1")
			}
		};
		UI.DEF = {
			GRAPH : document.getElementById("graph-def"),
			TABLE : { 
				NODE : document.getElementById("graph-def-table"),
				LIST : [
					document.getElementById("graph-armor-A"),
					document.getElementById("graph-armor-0"),
					document.getElementById("graph-armor-1"),
					document.getElementById("graph-armor-2"),
					document.getElementById("graph-armor-3")
				]
			},
			CHECK : [
				document.getElementById("graph-def-check-1"),
				document.getElementById("graph-def-check-2")
			]
		};
		UI.RNG = {
			GRAPH : {
				NODE : document.getElementById("graph-dmg-rng"),
				LIST : document.getElementById("graph-dmg-rng").getElementsByTagName("rect")
			},
			TABLE : [
				{
					NODE : document.getElementById("graph-range-data-0"),
					LIST : document.getElementById("graph-range-data-0").getElementsByTagName("td")
				}
			],
			SONAR : document.getElementById("graph-sonar")
		};

		bpa.addEventHandler(UI.DEF.TABLE.NODE, "click", shipYard.updateShipData);
	}

	//
	// Helper Functions
	//

	function dmgZonSort (a, b) {return b.dmg - a.dmg;}

	//
	// Update Functions
	//

	function updateGraphs (shipStat) {
		updateDmgBars(shipStat);
		updateDefDiamond(shipStat);
		updateDmgRng(shipStat);
	}

	function updateDmgBars (shipStat) {
		var SSHIP_PLAN = shipYard.getShipPlan(),
			SLOTVS = shipYard.getShipPlan().slotVals,
			g;
		for (var i = 0, ii = DT_1.length; i < ii; i++) { // graphs dmg type bar graphs
			for (var j = 0, jj = DT_0.length; j < jj; j++) {
				g = 0;
				for (var k = 0, kk = SSHIP_PLAN.getItem(0,0).slots[1]; k < kk; k++)
					g += SSHIP_PLAN.getItem(1, k).getDPS(DT_0[j], DT_1[i], shipStat.mods);
				g = window.Math.ceil(g * 8 / 100);
				UI.DPSBARS[DT_N[i]][j].setAttribute("y", 160 - g);
				UI.DPSBARS[DT_N[i]][j].setAttribute("height", g);
			}
		}
	}

	function updateDefDiamond (shipStat) {
		var a = [];
		UI.DEF.TABLE.LIST[0].innerHTML = shipStat.armor;
		for (var i = 0, j = -1; i <= 3; i++, j *= -1) { // graphs defense bonuses
			a[i] = 1;
			if (UI.DEF.CHECK[0].checked)
				a[i] *= 1 - shipStat["def" + DTAG[i] ];
			if (UI.DEF.CHECK[1].checked && !(i === 2))
				a[i] *= (shipStat.evade>1)? 1 : shipStat.evade;
			UI.DEF.TABLE.LIST[i + 1].innerHTML = bpa.numClean(shipStat.armor / a[i]);
			a[i] = 100 + 80 * j * (1 - a[i]);
		}
		UI.DEF.GRAPH.setAttribute(
			"points",
			"100," + a[0] + " " + a[1] + ",100 100," + a[3] + " " + a[2] + ",100"
		);
	}

	function updateDmgRng (shipStat) {
		var a = shipStat.rZon.slice().sort(dmgZonSort);
		for (var i = 0; i < 12; i++) { // graphs dps range breakdown
			if (i < a.length) {
				UI.RNG.GRAPH.LIST[i].setAttribute("x", 40 + a[i].min * 5);
				UI.RNG.GRAPH.LIST[i].setAttribute("width", (a[i].max - a[i].min) * 5);
				//UI.RNG.GRAPH.LIST[i].setAttribute("title","?");
				UI.RNG.TABLE[0].LIST[i+1].innerHTML = bpa.numClean(a[i].dmg);
			}
			else{
				UI.RNG.GRAPH.LIST[i].setAttribute("x",0);
				UI.RNG.GRAPH.LIST[i].setAttribute("width",0);
				UI.RNG.TABLE[0].LIST[i+1].innerHTML = "-";
			}
		}
		UI.RNG.SONAR.setAttribute("x", shipStat.detectRng * 5 + 25);
	}

	//
	// Export
	//

	return {
		init         : init,
		updateGraphs : updateGraphs
	};

})();

//-//--0cd//
//
// SHIP CODE GENERATOR
//
//-////////////////

var shipCodeGenerator = (function () {

	var UI = {},
		ISTAT,
		SNIPPET = 4;

	//
	// Initialization
	//

	function init () {
		ISTAT = bpa.ISTAT;
		UI.SHIPCODEINPUT = document.getElementById("ShipCodeInput");
		shipCodeGenerator.init = null;
	}

	//
	// Helper Functions
	//

	function encode (n) {
		//if (n<0x10) return "0"+n.toString(16);
		//else if (n>=0x10 && n<=0xff) return n.toString(16);
		//else return "00";
		if (n === 0) return "0000";
		return n.toString();
	}

	function encodeRank (n) {
		if (window.isNaN(n) || n > 25 || n < 0) return "00";
		else if (n < 10) return "0" + n.toString();
		else return n.toString();
	}

	function decode (s, i) {
		//var n=parseInt(s,16);
		//if (n && n<ISTAT[i].length) return n;
		//else return 0;
		return parseInt(s);
	}

	//
	// Public Methods
	//

	function encipher (shipPlan) {
		var I_SLOTS = shipPlan.getItem(0,0).slots, s="";
		for (var i = 0, ii = I_SLOTS.length; i < ii; i++)
			for (var j = 0, jj = I_SLOTS[i]; j < jj; j++)
				s += encode(shipPlan.slotVals[i][j].id);
		s += encodeRank(shipPlan.shipRank);
		return s;
	}

	function decipher (s) {
		var hull = ISTAT.getItemById(0, decode(s.slice(0, SNIPPET), 0)),
			a = [], k = 0, r;
		if (!hull) {window.console.log("Error: Ship data could not be read"); return;}
		for (var i = 0, ii = hull.slots.length; i < ii; i++) {
			a.push([]);
			for (var j = 0, jj = hull.slots[i]; j < jj; j++, k += SNIPPET)
				a[i].push(ISTAT.getItemById(i, decode(s.slice(k, k + SNIPPET), i) ));
		}
		r = Number(s.slice(k, k + 2));
		if (r < 0 || r > 25) r = 0;
		return bpa.createShipPlan(a,r);
	}

	function buildFromCode () {
		shipYard.setShipPlan(shipCodeGenerator.decipher(UI.SHIPCODEINPUT.value));
		bpa.closeAll();
	}

	//
	// User interface
	//

	function onMenuOpen () {
		UI.SHIPCODEINPUT.value = shipCodeGenerator.encipher(shipYard.getShipPlan());
	}

	//
	// Export
	//

	return {
		init          : init,
		onMenuOpen    : onMenuOpen,
		encipher      : encipher,
		decipher      : decipher,
		buildFromCode : buildFromCode
	};

})();

//-//--0sv//
//
// SHIP SAVES
//
//-////////////////

var shipSaveManager = (function () {

	var ISTAT,
		kLS          = {TYPE: 0, NAME : 1, DATA : 2},
		ITEM_TYPE    = "ShipPlan",
		DEFAULT_NAME = "New Ship",
		SEPARATOR    = "::",
		BLANK_SHIP_PLAN,
		shipSavesViews = [];

	//
	// Initialization
	//

	/**
	 * Initialize module.
	 */
	function init () {
		// requires bpa and shipCodeGenerator
		ISTAT = bpa.ISTAT;
		BLANK_SHIP_PLAN = shipCodeGenerator.encipher(bpa.createShipPlan());
		shipSaveManager.init = null;
	}

	/**
	 * Create a ship save manager view object.
	 *
	 * @param {Element} [elem]
	 * @returns {Object} shipSaveManagerInstance
	 */
	function create (elem) {
		var i = shipSavesViews.length;
		if (!(elem instanceof window.Element)) elem = document.createElement("div");
		shipSavesViews.push(bpa.createSelectItemGroup(elem, getClickShipSaveHandler(i), 0));
		initShipSaveSlots();
		return {
			elem         : elem,
			copyShip     : (function (i) {copyShip(getSelectedShip(i));}).bind(this, i),
			nameShip     : (function (i) {nameShip(getSelectedShip(i));}).bind(this, i),
			deleteShip   : (function (i) {deleteShip(getSelectedShip(i));}).bind(this, i),
			selectedShip : selectedShip.bind(this, i)
		};
	}

	/**
	 * Initialize view instance.
	 */
	function initShipSaveSlots () {
		var itemData,
			localStorageItem;
		for (var i = 0, ii = window.localStorage.length; i < ii; i++) {
			localStorageItem = window.localStorage.getItem(window.localStorage.key(i));
			itemData = retrieveData(localStorageItem);
			if (itemData && itemData[kLS.TYPE] === ITEM_TYPE) {
				appendShipSaveSlot(
					window.localStorage.key(i), itemData[kLS.NAME], itemData[kLS.DATA]
				);
			}
		}
	}

	//
	// Classes
	//

	/**
	 * ShipSaveIcon
	 *
	 * @constructor
	 * @param {string} saveName
	 * @param {string} saveData
	 */
	function ShipSaveIcon (saveName, saveData) {
		this._hull =
			shipCodeGenerator.decipher(saveData).slotVals[0][0] ||
			ISTAT[0][1];
		this.elem  = null;
		this._icon = null; // ItemIcon
		this._name = null; // HTMLElement
		this.createElem();
		this.setName(saveName);
	}
	ShipSaveIcon.prototype.createElem = function () {
		var newSlot = document.createElement("div"),
			newP    = document.createElement("p"),
			newIcon = this.createIcon();
		newSlot.classList.add("shipsave-slot");
		newSlot.appendChild(newIcon.elem);
		newSlot.appendChild(newP);
		this.elem  = newSlot;
		this._icon = newIcon;
		this._name = newP;
		return newSlot;
	};
	ShipSaveIcon.prototype.createIcon = function () {return this._hull.createItemIcon();};
	ShipSaveIcon.prototype.createImg  = function () {return this.createIcon().elem;};
	ShipSaveIcon.prototype.setImg     = function (item) {this._icon.setItemImg(item);};
	ShipSaveIcon.prototype.setName    = function (s) {
		var _p = this._name;
		if (_p.firstChild) _p.removeChild(_p.firstChild);
		_p.appendChild(document.createTextNode(s));
		this.elem.alt = "[" + s + "]";
	};

	/**
	 * ShipSaveSlot
	 *
	 * @constructor
	 * @param {string} saveId
	 * @param {string} saveName
	 * @param {string} saveData
	 */
	function ShipSaveSlot (saveId, saveName, saveData) {
		this.saveId = saveId;
		this.data   = saveData;
		this.icon   = new ShipSaveIcon(saveName,saveData);
		this.elem   = this.icon.elem;	
	}
	ShipSaveSlot.prototype.focus      = function (b) {
		if (b) this.elem.classList.add("focus");
		else  this.elem.classList.remove("focus");
	};

	/**
	 * Creates ShipSaveIcon.
	 *
	 * @param {string} saveName
	 * @param {string} saveData
	 */
	function createShipSaveIcon (saveName, saveData) {
		if (typeof saveName !== "string") saveName = DEFAULT_NAME;
		if (!saveData)                    saveData = BLANK_SHIP_PLAN;
		return new ShipSaveIcon(saveName, saveData);
	}

	//
	// Update View
	//

	/**
	 * Append ship save to view.
	 *
	 * @param {string} saveId
	 * @param {string} saveName
	 * @param {string} saveData
	 */
	function appendShipSaveSlot (saveId, saveName, saveData) {
		var newShipSaveSlot;
		for (var i = 0; i < shipSavesViews.length; i++) {
			newShipSaveSlot = new ShipSaveSlot(saveId, saveName, saveData);
			shipSavesViews[i].children.push(newShipSaveSlot);
			shipSavesViews[i].elem.appendChild(newShipSaveSlot.elem);
		}
	}

	/**
	 * Update ship save slot view.
	 *
	 * @param {number} j - save slot index
	 * @param {string} saveId
	 * @param {string} saveName
	 * @param {string} saveData
	 */
	function updateShipSaveSlot (j, saveId, saveName, saveData) {
		var newShipSaveSlot = new ShipSaveSlot(saveId, saveName, saveData);
		for (var i = 0; i < shipSavesViews.length; i++) {
			bpa.replaceElement(
				shipSavesViews[i].children[j].elem,
				newShipSaveSlot.elem
			);
			shipSavesViews[i].children[j].elem = newShipSaveSlot.elem;
		}
	}

	/**
	 * Update ship save manager views.
	 */
	function updateShipSaveSlots () {
		var itemData,
			localStorageItem;
		for (var i = 0, ii = window.localStorage.length; i < ii; i++) {
			localStorageItem = window.localStorage.getItem(window.localStorage.key(i));
			itemData = retrieveData(localStorageItem);
			if (itemData && itemData[kLS.TYPE] === ITEM_TYPE) {
				updateShipSaveSlot(
					i, window.localStorage.key(i), itemData[kLS.NAME], itemData[kLS.DATA]
				);
			}
		}
	}

	//
	// Helper Functions
	//

	/**
	 * Retrieve data from localStorage.
	 *
	 * @returns {Array.<string>|null} [saveName, saveData]
	 */
	function retrieveData (localStorageItem) {
		if (localStorageItem) return localStorageItem.split(SEPARATOR);
		else {
			window.console.log("Error: Could not read ship data:");
			window.console.log(localStorageItem);
			return null;
		}
	}

	/**
	 * Prompt user to enter a ship name.
	 *
	 * @returns {string} saveName
	 */
	function enterName () {
		var saveName;
		while (true) {
			saveName = window.prompt("Name your ship:", DEFAULT_NAME);
			if (saveName === "") {
				saveName = DEFAULT_NAME;
				break;
			}
			else if (saveName && saveName.indexOf(SEPARATOR) !== -1) {
				window.alert("Invalid: Name cannot contain " + SEPARATOR);
			}
			else break;
		}
		return saveName;
	}

	/**
	 * Check if ship name is valid.
	 *
	 * @param {string} saveName
	 * @returns {bool} isValid
	 */
	function isValidName (saveName) {return saveName !== null;}

	/**
	 * Get unused localStorage key.
	 *
	 * @returns {string} saveId
	 */
	function getVacantKey () {
		var l = window.localStorage.length;
		for (var i = 0; i < l; i++) {
			if (!window.localStorage.getItem(i.toString())) {
				return i.toString();
			}
		}
		return l.toString();
	}

	/**
	 * Ensure that selected ship exists.
	 *
	 * @param {number} i - view index
	 * @returns {bool} currentShipExists
	 */
	function checkCurrentShip (i) {
		if (shipSavesViews[i].selected) return true;
		else {
			alert("No ship selected");
			return false;
		}
	}

	/**
	 * Save new ship to localStorage.
	 *
	 * @param {string} saveName
	 * @param {string} saveData
	 */
	function saveShip (saveName, saveData) {
		var saveId = getVacantKey();
		window.localStorage.setItem(saveId, ITEM_TYPE + SEPARATOR + saveName + SEPARATOR + saveData);
		appendShipSaveSlot(saveId, saveName, saveData);
	}

	/**
	 * Delete a ship from localStorage.
	 *
	 * @param {shipSaveManager.ShipSaveSlot} shipSave
	 */
	function removeShip (shipSave) {
		window.localStorage.removeItem(shipSave.saveId);
		for (var i = 0; i < shipSavesViews.length; i++) {
			if (shipSavesViews[i].selected)
				bpa.removeElement(shipSavesViews[i].selected.elem);
			shipSavesViews[i].remove(shipSave);
		}
	}

	//
	// Handlers
	//

	/**
	 * Click handler.
	 *
	 * @param {number} i - view index
	 */
	function getClickShipSaveHandler (i) {
		return function (x, s) {
			shipSavesViews[i].select(s);
			shipSavesViews[i].selected.focus(true);
		};
	}

	//
	// Main Functions
	//

	/**
	 * Save new ship.
	 */
	function newShip () {
		var saveName = enterName();
		if (isValidName(saveName)) {
			saveShip(saveName, shipCodeGenerator.encipher(shipYard.getShipPlan()));
		}
	}

	/**
	 * Get selected save ship plan.
	 *
	 * @param {number} i - view index
	 * @returns {bpa.ShipPlan|null} selectedShipPlan
	 */
	function selectedShip (i) {
		if (checkCurrentShip(i)) {
			return shipCodeGenerator.decipher(
				retrieveData(
					window.localStorage.getItem(shipSavesViews[i].selected.saveId)
				)[kLS.DATA]
			);
		}
		else return null;
	}

	/**
	 * Get selected save ship plan.
	 *
	 * @param {number} i - view index
	 * @returns {shipSaveManager.ShipSaveSlot} selectedShip
	 */
	function getSelectedShip (i) {return shipSavesViews[i].selected;}

	/**
	 * Name a ship save.
	 *
	 * @param {shipSaveManager.ShipSaveSlot} shipSaveSlot
	 */
	function nameShip (shipSaveSlot) {
		var saveName;
		if (shipSaveSlot instanceof ShipSaveSlot) {
			saveName = enterName();
			if (isValidName(saveName)) {
				window.localStorage.setItem(
					shipSaveSlot.saveId,
					ITEM_TYPE + SEPARATOR + saveName + SEPARATOR + shipSaveSlot.data
				);
				updateShipSaveSlots();
			}
		}
	}

	/**
	 * Copy ship save.
	 *
	 * @param {shipSaveManager.ShipSaveSlot} shipSaveSlot
	 */
	function copyShip (shipSaveSlot) {
		var saveName;
		if (shipSaveSlot instanceof ShipSaveSlot) {
			saveName = enterName();
			if (isValidName(saveName)) {
				saveShip(saveName, shipSaveSlot.data);
			}
		}
	}

	/**
	 * Delete ship save.
	 *
	 * @param {shipSaveManager.ShipSaveSlot} shipSaveSlot
	 */
	function deleteShip (shipSaveSlot) {
		if (shipSaveSlot instanceof ShipSaveSlot) {
			removeShip(shipSaveSlot);
			shipSaveSlot.focus(false);
			//shipSavesViews[i].selected = null;
		}
	}

	/**
	 * Delete all ship saves.
	 */
	function clearShips () {
		var localStorageItem,
			itemKey,
			itemData;
		for (var i = 0; i < localStorage.length;) {
			itemKey = window.localStorage.key(i);
			localStorageItem = window.localStorage.getItem(itemKey);
			itemData = retrieveData(localStorageItem);
			if (itemData && itemData[kLS.TYPE] === ITEM_TYPE) {
				window.localStorage.removeItem(itemKey);
			}
			else i++;
		}
		for (var i = 0; i < shipSavesViews.length; i++) {
			bpa.removeAllChildren(shipSavesViews[i].elem);
		}
	}

	//
	// Export
	//

	return {
		init         : init,
		create       : create,
		newShip      : newShip,
		copyShip     : copyShip,
		nameShip     : nameShip,
		deleteShip   : deleteShip,
		clearShips   : clearShips,
		selectedShip : selectedShip,
		createShipSaveIcon : createShipSaveIcon
	};

})();

//-//--0bf//
//
// BEST FINDER
//
//-////////////////

var bestCalculator = (function () {

	var UI = {},
		ISTAT,
		settings = {
			isChecked : {1 : false, 2 : false},
			wt        : {1 : 0,     2 : 0},
			rng       : 0,
			dType0    : 0,
			dType1    : 0,
			slotsA    : {1 : 0, 2 : 0},
			slotsD    : 0,
			slotsU    : 0
		},
		result   = {1 : [], 2 : []};

	//
	// Initialization
	//

	function init () {
		ISTAT = bpa.ISTAT;
		initUI();
		bestCalculator.init = null;
	}

	function initUI () {
		UI.MENU   = document.getElementById("sy-menu-best");
		UI.INPUTS = {
			1 : document.forms["best-settings-weap"].elements,
			2 : document.forms["best-settings-armr"].elements
		};
		UI.RESULT_BOX = {
			1 : document.getElementById("best-result-weap"),
			2 : document.getElementById("best-result-armr")
		};
		UI.SECTION = {
			1 : document.getElementById("best-section-weap"),
			2 : document.getElementById("best-section-armr")
		};
		UI.WEIGHTING = document.getElementById("best-weighting");

		bpa.addEventHandler(
			document.getElementById("sy-button-best"), "click", openBestMenu
		);

		bpa.addEventHandler(
			UI.INPUTS[1]["best-input-check"], "change", function () {sectionCheck(1);}
		);
		bpa.addEventHandler(
			UI.INPUTS[2]["best-input-check"], "change", function () {sectionCheck(2);}
		);

		bpa.addEventHandler(
			document.getElementById("best-button-find"),  "click", findShipPlan
		);
		bpa.addEventHandler(
			document.getElementById("best-button-build"), "click", buildResult
		);
		bpa.addEventHandler(
			document.getElementById("best-button-close"), "click", closeBestMenu
		);
	}

	//
	// Main functions
	//

	function findShipPlan () {
		bpa.shroud(true);
		inputVal();
		calcItems(2);
		calcItems(1);
		bpa.shroud(false);
	}

	function inputVal () {
		var hull = shipYard.getShipPlan().getItem(0,0),
			_e2  = UI.INPUTS[2]["best-input-check"].checked,
			_e1  = UI.INPUTS[1]["best-input-check"].checked,
			isWeightingOn = (!UI.WEIGHTING.disabled && _e1 && _e2),
			weighting1,
			weighting2,
			_w1,
			_w2;
		_w2 = (_e2)? inputWeight(2) : 0;
		_w1 = (_e1)? inputWeight(1) : 0;
		if (isWeightingOn) {
			weighting1 = window.Math.floor(hull.weight * UI.WEIGHTING.value / 100);
			weighting2 = window.Math.floor(hull.weight * ((100 - UI.WEIGHTING.value) / 100));
			if (_w1 > weighting1) _w1 = weighting1;
			if (_w2 > weighting2) _w2 = weighting2;
		}
		settings.isChecked[1] = _e1;
		settings.isChecked[2] = _e2;
		settings.wt[1]        = _w1;
		settings.wt[2]        = _w2;
		settings.rng          = parseInt(UI.INPUTS[1]["best-input-range"].value, 10) || null;
		settings.dType0       = UI.INPUTS[1]["best-input-dtype-0"].value || 0;
		settings.dType1       = UI.INPUTS[1]["best-input-dtype-1"].value || 0;
		settings.slotsA[1]    = hull.slots[1];
		settings.slotsA[2]    = hull.slots[2];
		settings.slotsD       = hull.slots.wt[0] + hull.slots.wt[1];
		settings.slotsU       = hull.slots.wt[1] + hull.slots.wt[2];
	}

	function inputWeight (x) {
		var hull = shipYard.getShipPlan().getItem(0,0),
			w    = parseInt(UI.INPUTS[x]["best-input-weight"].value, 10) || null;
		     if (w === null)      return hull.weight;
		else if (w > hull.weight) return hull.weight;
		else                      return w;
	}

	function calcItems (x) {
		if (settings.isChecked[x]) {
			result[x] = genAlgBrute(x, settings)();
			displayResult(x);
		}
	}

	function genAlgBrute(x, settings) {
		return (function (x, settings) {
			var X    = x,
				IS_W = (X === 1),
				IS_A = (X === 2),
				HULL = shipYard.getShipPlan().getItem(0,0),
				S    = settings.slotsA[x] || 0,
				D    = settings.slotsD,
				U    = settings.slotsU,
				W    = settings.wt[x] || 0,
				R    = settings.rng,
				DT0  = settings.dType0,
				DT1  = settings.dType1;
			var iList,
				iL,
				cList,
				cBest,
				_resultY = [];

			function CListItem (a) {this.c = a.slice();}
			CListItem.prototype.tDps = function () {
				var n = 0;
				for (var i = 0, ii = this.c.length; i < ii; i++)
					n += ISTAT[1][this.c[i]].dps[DT0][DT1];
				return n;
			};
			CListItem.prototype.tArm = function () {
				var n = 0;
				for (var i = 0, ii = this.c.length; i < ii; i++) n += ISTAT[2][this.c[i]].armor;
				return n;
			};
			CListItem.prototype.tWgt = function () {
				var n = 0;
				for (var i = 0, ii = this.c.length; i < ii; i++) n += ISTAT[X][this.c[i]].weight;
				return n;
			};
			CListItem.prototype.wFit = function () {
				var a = 0,
					b = 0,
					c,
					i = this.c.length;
				while (--i) {
					c = ISTAT[1][this.c[i]].type;
					if (c === 0) continue;
					else if (c === 5) b++;
					else a++;
				}
				return !(a > D || b > U);
			};

			function initIList () { // creates array of items to be compared
				var _item;
				iList = [];
				for (var i = 0, ii = ISTAT[X].length; i < ii; i++) {
					_item = ISTAT[X][i];
					if (itemCheck(_item)) continue;
					iList.push([
						i,
						(IS_W)? _item.dps[DT0][DT1] : _item.armor,
						_item.weight,
					]);
				}
				iL = iList.length;
			}

			function itemCheck(_item) {
				if (IS_W) {
					return (
						(R !== null && (R > _item.maxRng || R < _item.minRng)) ||
						W < _item.weight ||
						_item.dps[DT0][DT1] === 0
					);
				}
				else if (IS_A) return _item.unlock[0] === 3;
			}

			function initCList () {
				cList = [];
				makeC([], 0);
				if (!cList.length) cList[0] = new CListItem([]);
			}

			function makeC(a, ii) { // creates and checks all possible combinations, inefficient
				for (var i = ii; i < iL; i++) {
					a.push(iList[i][0]);
					if (a.length !== S) makeC(a, i);
					else{
						var newC = new CListItem(a);
						if (  newC.tWgt() <= W && ((newC.wFit() && IS_W) || IS_A)  )
							cList.push(newC);
					}
					a.pop();
				}
			}

			function sortCList() {
				if (IS_W) {
					for (var i = 0, ii = cList.length, iBest = 0; i < ii; i++) {
						cList[i].v = cList[i].tDps();
						if (cList[i].v > cList[iBest].v) iBest = i;
					}
				}
				else if (IS_A) {
					for (var i = 0, ii = cList.length, iBest = 0; i < ii; i++) {
						cList[i].v = cList[i].tArm();
						if (cList[i].v > cList[iBest].v) iBest = i;
					}
				}
				cBest = cList[iBest];
				cList = null;
			}

			function saveResult() {
				_resultY = [];
				for (var i = 0; i < S; i++) _resultY.push(ISTAT[X][cBest.c[i] || 0]);
			}

			return function () {
				initIList();
				initCList();
				sortCList();
				saveResult();
				return _resultY;
			};

		})(x, settings);
	}

	function displayResult(x) {
		while(UI.RESULT_BOX[x].firstChild)
			UI.RESULT_BOX[x].removeChild(UI.RESULT_BOX[x].firstChild);
		for (var j = 0, jj = result[x].length; j < jj; j++)
			UI.RESULT_BOX[x].appendChild( result[x][j].createItemIcon().elem );
	}

	function buildResult() {
		var newShipPlan = shipYard.getShipPlan();
		newShipPlan.requip([
			,
			(settings.isChecked[1])? result[1] : [],
			(settings.isChecked[2])? result[2] : []
		]);
		shipYard.setShipPlan(newShipPlan);
		closeBestMenu();
	}

	//
	// User interface
	//

	function openBestMenu() {
		if (shipYard.getShipPlan().getItem(0, 0).id !== 0) {
			shipYard.closeItemMenu();
			if (shipSaveManager) shipSaveManager.close();
			UI.MENU.classList.remove("hidden");
			document.getElementById("sy-view-menu").classList.remove("hidden");
			bestCalculator.sectionCheck(2);
			bestCalculator.sectionCheck(1);
		}
		else alert("Select a Hull first");
	}

	function closeBestMenu() {
		UI.MENU.classList.add("hidden");
		document.getElementById("sy-view-menu").classList.add("hidden");
	}

	function sectionCheck(x) {
		settings.isChecked[1] = UI.INPUTS[1]["best-input-check"].checked;
		settings.isChecked[2] = UI.INPUTS[2]["best-input-check"].checked;
		if (settings.isChecked[x]) UI.SECTION[x].classList.remove("disabled");
		else                      UI.SECTION[x].classList.add("disabled");
		for (var i = 1, ii = UI.INPUTS[x].length; i < ii; i++)
			UI.INPUTS[x][i].disabled = !settings.isChecked[x];
		UI.WEIGHTING.disabled = !(settings.isChecked[2] && settings.isChecked[1]);
		UI.WEIGHTING.style.visibility = (UI.WEIGHTING.disabled)? "hidden" : "visible";
	}

	//
	// Export
	//

	return {
		init          : init,
		result        : result,
		openMenu      : openBestMenu,
		close         : closeBestMenu,
		sectionCheck  : sectionCheck,
		findShipPlan : findShipPlan,
		buildResult   : buildResult
	};

})();

//-//--0dt//
//
// DATA TABLE
//
//-////////////////

var dataTable = (function () {

	var UI = {},
		ISTAT,
		DROWS,
		settings = {
			x      : -1,    // Ship part type (0=hulls, 1=weapons, etc.)
			tOrder : 0,     // Ship parts sorted by tOrder
			rOrder : false, // Reverse order
			vRows  : [   // Row visibility
				[false, true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  false, false, false, false, false, false],
				[false, true,  true,  true,  true,  true,  true,  true,  false, false, false, false, false, false, false, true,  true,  true,  true,  true,  true,  false, false, false, false, false, false],
				[false, true,  true,  true,  true,  true,  true,  false, false, false, false, false, false]
			],
			vCols  : [   // Column visibility
				[], [], []
			],
			vTech  : [   // Tech visibility
				true,
				true,
				true
			],
			vWeaps : {  // Weapon visibility
				Bal : true,
				Pen : true,
				Exp : true,
				Con : true,
				Ant : true
			},
			vWType : [true, true, true, true, true, true, true, true, true]
			
		},
		td = {cells : [], cols : []};

	//
	// Initialization
	//

	function init () {

		function initHandlers () {
			var TCH_CHK = UI.MENU.getElementsByTagName("div")[0].getElementsByTagName("input");
			bpa.addEventHandler(TCH_CHK[0], "change", function () {
				settings.vTech[0] = this.checked;
				updateVCols();
			});
			bpa.addEventHandler(TCH_CHK[1], "change", function () {
				settings.vTech[1] = this.checked;
				updateVCols();
			});
			bpa.addEventHandler(TCH_CHK[2], "change", function () {
				settings.vTech[2] = this.checked;
				updateVCols();
			});
			bpa.addEventHandler(
				document.getElementById("dt-button-0"), "click", reset.bind(this, 0)
			);
			bpa.addEventHandler(
				document.getElementById("dt-button-1"), "click", reset.bind(this, 1)
			);
			bpa.addEventHandler(
				document.getElementById("dt-button-2"), "click", reset.bind(this, 2)
			);
		}

		ISTAT    = bpa.ISTAT;
		UI.TABLE = document.getElementById("dt-table-tbody");
		UI.MENU  = document.getElementById("dt-menu-v");
		initHandlers();
		initDRows();
		initVMenus();
		updateVMenu();
		dataTable.init = null;
	}

	function initDRows() {
		DROWS = [];
		DROWS.push(
			[
				["Id #"           ,true,function (item) {return document.createTextNode(item.id);}                ,function (item) {return item.id;}      ],
				["Image"          ,true,function (item) {return item.createItemIcon().elem;}                      ,function (item) {return item.id;}      ],
				["Name"           ,true,function (item) {return document.createTextNode(item.name);}              ,function (item) {return item.name;}    ],
				["Tech"           ,true,function (item) {return document.createTextNode((item.tech===1)?"D":(item.tech===2)?"R":"F");},function (item) {return item.tech;}    ],
				["Weapon Slots"   ,true,function (item) {return document.createTextNode(item.slots[1]);}          ,function (item) {return item.slots[1];}],
				["Armor Slots"    ,true,function (item) {return document.createTextNode(item.slots[2]);}          ,function (item) {return item.slots[2];}],
				["Special Slots"  ,true,function (item) {return document.createTextNode(item.slots[3]);}          ,function (item) {return item.slots[3];}],
				["Tactical Slots" ,true,function (item) {return document.createTextNode(item.slots[4]);}          ,function (item) {return item.slots[4];}],
				["Refittable"     ,true,function (item) {return document.createTextNode((item.refit)?"yes":"no");},function (item) {return Number(item.refit);}   ],
				["Base Armor"     ,true,function (item) {return document.createTextNode(item.armor);}             ,function (item) {return item.armor;}   ],
				["Cargo"          ,true,function (item) {return document.createTextNode(item.cargo);}             ,function (item) {return item.cargo;}   ],
				["Sonar Range"    ,true,function (item) {return document.createTextNode(item.sonarRng);}          ,function (item) {return item.sonarRng;}],
				["Map Speed"      ,true,function (item) {return document.createTextNode(item.mSpeed);}            ,function (item) {return item.mSpeed;}  ],
				["Combat Speed"   ,true,function (item) {return document.createTextNode(item.cSpeed);}            ,function (item) {return item.cSpeed;}  ],
				["Turn Speed"     ,true,function (item) {return document.createTextNode(item.tSpeed);}            ,function (item) {return item.tSpeed;}  ],
				["Evasion"        ,true,function (item) {return document.createTextNode(bpa.numToPercent(1-item.evade));},function (item) {return item.evade;}   ],
				["Repair Modifier",true,function (item) {return document.createTextNode(bpa.numToPercent(item.repMod));} ,function (item) {return item.repMod;}  ],
				["Ship Modifiers" ,true,function (item) {return document.createTextNode(item.sMods.print());}     ,function (item) {return Object.keys(item.sMods).length;}],
				["Weight"         ,true,function (item) {return document.createTextNode(item.weight);}            ,function (item) {return item.weight;}  ],
				["Build Cost"     ,true,function (item) {return document.createTextNode("");}                     ,function (item) {return item.costs[0];}],
				["Time"           ,true,function (item) {return document.createTextNode(item.costs.printTime());} ,function (item) {return item.costs[0];}],
				["Oil"            ,true,function (item) {return document.createTextNode(item.costs[1]);}      ,function (item) {return item.costs[1];}],
				["Metal"          ,true,function (item) {return document.createTextNode(item.costs[2]);}      ,function (item) {return item.costs[2];}],
				["Energy"         ,true,function (item) {return document.createTextNode(item.costs[3]);}      ,function (item) {return item.costs[3];}],
				["Zynthium"       ,true,function (item) {return document.createTextNode(item.costs[4]);}      ,function (item) {return item.costs[4];}]
			]
		);
		DROWS.push(
			[
				DROWS[0][0],
				DROWS[0][1],
				DROWS[0][2],
				DROWS[0][3],
				["Weapon Type"    ,true,function (item) {return document.createTextNode(item.getWTypeName());}    ,function (item) {return item.wType;} ],
				["Damage Type"    ,true,function (item) {return document.createTextNode(item.getDTypeName());}    ,function (item) {return item.dType;} ],
				["Min Range"      ,true,function (item) {return document.createTextNode(item.minRng);}            ,function (item) {return item.minRng;}],
				["Max Range"      ,true,function (item) {return document.createTextNode(item.maxRng);}            ,function (item) {return item.maxRng;}],
				["Damage"         ,true,function (item) {return document.createTextNode(item.getDmg(kDT.SHIP,kDT.NON));},function (item) {return item.getDmg(kDT.SHIP,kDT.NON);}  ],
				["Bldg Damage"    ,true,function (item) {return document.createTextNode(window.Math.floor(item.getDmg(kDT.BLDG,kDT.NON)));},function (item) {return item.getDmg(kDT.BLDG,kDT.NON);}  ],
				["Reload"         ,true,function (item) {return document.createTextNode(item.reload);}            ,function (item) {return item.reload;}],
				["Salvo"          ,true,function (item) {return document.createTextNode(item.salvo);}             ,function (item) {return item.salvo;} ],
				["Accuracy"       ,true,function (item) {return document.createTextNode(item.accur);}             ,function (item) {return item.accur;} ],
				["Splash"         ,true,function (item) {return document.createTextNode(item.splash);}            ,function (item) {return item.splash;}],
				["Spread"         ,true,function (item) {return document.createTextNode(item.spread);}            ,function (item) {return item.spread;}],
				["DPS"            ,true,function (item) {return document.createTextNode(bpa.numClean(item.getDPS(kDT.SHIP,kDT.NON)));},function (item) {return item.getDPS(kDT.SHIP,kDT.NON);}  ],
				["BDPS"           ,true,function (item) {return document.createTextNode(bpa.numClean(item.getDPS(kDT.BLDG,kDT.NON)));},function (item) {return item.getDPS(kDT.BLDG,kDT.NON);}  ],
				["DPW"            ,true,function (item) {return document.createTextNode(bpa.numClean(item.getDPW(kDT.SHIP,kDT.NON)));},function (item) {return item.getDPW(kDT.SHIP,kDT.NON);}  ],
				["Item Modifiers" ,true,function (item) {return document.createTextNode(item.pMods.print());}     ,function (item) {return Object.keys(item.pMods).length;}],
				DROWS[0][DROWS[0].length - 8],
				DROWS[0][DROWS[0].length - 7],
				DROWS[0][DROWS[0].length - 6],
				DROWS[0][DROWS[0].length - 5],
				DROWS[0][DROWS[0].length - 4],
				DROWS[0][DROWS[0].length - 3],
				DROWS[0][DROWS[0].length - 2],
				DROWS[0][DROWS[0].length - 1]
			]
		);
		DROWS.push(
			[
				DROWS[0][0],
				DROWS[0][1],
				DROWS[0][2],
				DROWS[0][3],
				["Armor"          ,true,function (item) {return document.createTextNode(item.armor);}             ,function (item) {return item.armor;} ],
				DROWS[0][DROWS[0].length - 8],
				DROWS[0][DROWS[0].length - 7],
				DROWS[0][DROWS[0].length - 6],
				DROWS[0][DROWS[0].length - 5],
				DROWS[0][DROWS[0].length - 4],
				DROWS[0][DROWS[0].length - 3],
				DROWS[0][DROWS[0].length - 2],
				DROWS[0][DROWS[0].length - 1]
			]
		);
	}

	function initVMenus () {
		var ROW_CHK = UI.MENU.getElementsByTagName("div")[2],
			W_COLS  = [
				["All",          kWT.NONE],
				["Cannon",       kWT.CANN],
				["Missile",      kWT.MISS],
				["Mortar",       kWT.MORT],
				["Rockets",      kWT.RCKT],
				["Torpedoes",    kWT.TORP],
				["Depth Charge", kWT.DPCH],
				["Launcher",     kWT.LNCH],
				["Defensive",    kWT.DEFS]
			];

		function createCheck (i, j, type) {
			var newCheck = document.createElement("input");
			newCheck.classList.add("check");
			newCheck.setAttribute("type","checkbox");
			newCheck.setAttribute("value",j);
			if (type === 0) {
				newCheck.checked = settings.vWeaps[j];
				//newCheck.checked = settings.vWType[j];
				bpa.addEventHandler(newCheck, "change", function () {
					settings.vWeaps[j] = this.checked;
					//settings.vWType[j] = this.checked;
					updateVCols();
				});
			}
			else if (type === 1) {
				newCheck.checked = settings.vRows[i][j];
				bpa.addEventHandler(newCheck, "change", function () {
					settings.vRows[i][j] = this.checked;
					updateVRows();
				});
			}
			return newCheck;
		}

		function createVMenu (i) {
			var COL_CHK  = UI.MENU.getElementsByTagName("div")[1],
				newVMenu = document.createElement("div"),
				newH3;

			if (i === 1) {
				newH3 = document.createElement("h3");
				newH3.appendChild( document.createTextNode("Weapon Type") );
				COL_CHK.appendChild(newH3);
				COL_CHK.classList.add("dt-menu-v-checklist");
				for (var j in settings.vWeaps) {
					if (settings.vWeaps.hasOwnProperty(j)) {
						COL_CHK.appendChild( createCheck(i, j, 0) );
						COL_CHK.appendChild( document.createTextNode(j) );
					}
				}
				/*for (var j = 0, jj = W_COLS.length; j < jj; j++) {
					COL_CHK.appendChild( createCheck(i,j,0) );
					COL_CHK.appendChild( document.createTextNode(W_COLS[j][0]) );
				}*/
			}

			newVMenu.classList.add("dt-menu-v-checklist");
			for (var j = 0, jj = DROWS[i].length; j < jj; j++) {
				newVMenu.appendChild( createCheck(i, j, 1) );
				newVMenu.appendChild( document.createTextNode(DROWS[i][j][0]) );
				newVMenu.appendChild( document.createElement("br") );
			}

			return newVMenu;
		}

		UI.VMENUS = [];
		for (var i = 0; i <= 2; i++) {
			UI.VMENUS.push(createVMenu(i));
			ROW_CHK.appendChild(UI.VMENUS[i]);
		}
	}

	//
	// Main functions
	//

	function reset (x) {
		if (x !== settings.x) {
			settings.x      = x;
			settings.tOrder = 0;
			settings.rOrder = true;
			buildTable();
			sortTable(0);
			updateVMenu();
			updateVRows();
			updateVCols();
		}
	}

	function buildTable () {
		var XSTAT = ISTAT[settings.x],
			XROWS = DROWS[settings.x],
			ROWS  = XROWS.length,
			COLS  = XSTAT.length,
			newTable = document.createDocumentFragment(),
			newRow,
			newCell;

		// clear previous table data
		while (UI.TABLE.firstChild)
			UI.TABLE.removeChild(UI.TABLE.firstChild);
		td.cols  = [];
		td.cells = [];

		for (var k = 0; k < ROWS; k++) {

			// build new row
			newRow = document.createElement("tr");
			td.cells.push([]);

			// build first cell
			newCell = document.createElement("td");
			newCell.appendChild(document.createTextNode(XROWS[k][0]));
			bpa.addEventHandler(newCell, "click", sortTable.bind(this, k));
			newRow.appendChild(newCell);

			// build content cells
			for (var j = 0; j < COLS; j++) {
				newCell = document.createElement("td");
				newCell.appendChild( XROWS[k][2](XSTAT[j]) );
				td.cells[k].push(newCell);
				newRow.appendChild(newCell);
			}
			newTable.appendChild(newRow);
		}
		UI.TABLE.appendChild(newTable);

		// item order
		for (var j = 0; j < COLS; j++) td.cols.push(j);

	}

	function updateVMenu () {
		var COL_CHK = UI.MENU.getElementsByTagName("div")[1];
		if (settings.x === 1) COL_CHK.classList.remove("hidden");
		else                  COL_CHK.classList.add("hidden");
		for (var i = 0, ii = UI.VMENUS.length; i < ii; i++)
			UI.VMENUS[i].classList.add("hidden");
		if (settings.x >= 0) UI.VMENUS[settings.x].classList.remove("hidden");
	}

	function updateVRows () { // hides or shows table rows
		var TR_A  = UI.TABLE.childNodes,
			XROWS = settings.vRows[settings.x];
		for (var j = 0, jj = DROWS[settings.x].length; j < jj; j++) {
			if (XROWS[j]) TR_A[j].classList.remove("hidden");
			else          TR_A[j].classList.add("hidden");
		}
	}

	function updateVCols () {
		var TD_A    = td.cells,
			XSTAT   = ISTAT[settings.x],
			_vCols  = settings.vCols[settings.x],
			_vWeaps = settings.vWeaps,
			//_vWeaps = settings.vWType,
			_vTech  = settings.vTech,
			_isW    = (settings.x === 1);

		for (var i = 0, ii = XSTAT.length; i < ii; i++) {

			// vWeap check
			_vCols[i] = (_isW)? _vCols[i] = _vWeaps[XSTAT[i].getDTypeName().slice(0,3)] : true;

			// vTech and noItem check
			_vCols[i] = _vCols[i] && _vTech[XSTAT[i].tech] && (XSTAT[i].name.slice(0,2) !== "No");
		
			// hides or shows table columns
			for (var j = 0, jj = TD_A.length; j < jj; j++) {
				if (_vCols[i]) TD_A[j][i].classList.remove("hidden");
				else           TD_A[j][i].classList.add("hidden");
			}
		}
	}

	function sortTable (tOrder) {sortData(tOrder); updateSortedTable();}

	function sortData (tOrder) {
		var sOrder;

		// s tOrder
		if (typeof tOrder === "object") {
			sOrder = true;
			for (var i = 0, ii = tOrder.length; i < ii; i++) {
				if (tOrder[i] !== settings.tOrder[i]) {
					sOrder = false;
					break;
				}
			}
		}
		else sOrder = tOrder === settings.tOrder;

		// t tOrder
		if (sOrder) settings.rOrder = !settings.rOrder;
		else        settings.tOrder = tOrder;

		// sort
		td.cols.sort(contentSort);
	}

	function updateSortedTable () {
		var ROWS = DROWS[settings.x].length,
			COLS = ISTAT[settings.x].length,
			TR_A = UI.TABLE.childNodes,
			TD_A = td.cells,
			P    = td.cols;

		UI.TABLE.classList.add("hidden");
		for (var k = 0; k < ROWS; k++) {

			// outline selected row
			TR_A[k].classList.remove("dt-sort-up");
			TR_A[k].classList.remove("dt-sort-dn");
			if (k === settings.tOrder) TR_A[k].classList.add(
				(!settings.rOrder)? "dt-sort-up" : "dt-sort-dn"
			);

			// rearrange cells
			for (var j = 0; j < COLS; j++) TR_A[k].appendChild( TD_A[k][P[j]] );
		}
		UI.TABLE.classList.remove("hidden");
	}

	function contentSort (a, b) { // sorting algorithm
		var getProp = DROWS[settings.x][settings.tOrder][3],
			aX = getProp(ISTAT[settings.x][a]),
			bX = getProp(ISTAT[settings.x][b]),
			c;

		if (!(window.isNaN(aX) || window.isNaN(bX))) {
			c = aX - bX;
		}
		else if (typeof aX === "string" || typeof bX === "string") { // sort strings alphabetically
			aX = aX.toString().toLowerCase();
			bX = bX.toString().toLowerCase();
			     if (aX < bX)   c = -1; 
			else if (aX > bX)   c =  1;
			else if (aX === bX) c =  0;
			else                c = -1;
		}

		if (c === 0)
			c =
				+DROWS[settings.x][0][3](ISTAT[settings.x][a]) -
				+DROWS[settings.x][0][3](ISTAT[settings.x][b]);
		if (settings.rOrder) c *= -1;
		return c;
	}

	//
	// Export
	//

	return {
		init : init
	};

})();

//-//--0bm//
//
// BATTLE SIMULATOR
//
//-////////////////

var battleSimulator = (function () {

	var UI = {},
		ISTAT,
		MAX_FLEET_SIZE  = 5,
		SPRITE_W        = 40,
		SPRITE_H        = 40,
		SECOND          = 1000,
		TIME_LIMIT      = SECOND * 300,
		FPS             = 10,
		MAP             = {sizeX : 520, sizeY : 520, type : 0},
		FTYPE           = {V : 0, M : 1},
		FLEET_WIDTH     = 10,
		RELOAD_SPEED    = 1,
		currentStep     = 0,
		timeElapsed     = 0,
		isBattleOngoing = false,
		selectedShips   = [],
		selectedSprites = [],
		teams           = [];

	//
	// Initialization
	//

	function init () {

		function initUI () {
			UI.BATTLE_VIEW       = document.getElementById("bm-view-battle");
			UI.SETUP_VIEW        = document.getElementById("bm-view-setup");
			UI.MAP               = document.getElementById("bm-map");
			UI.LOG               = document.getElementById("bm-info");
			UI.TIME_COUNTER      = document.getElementById("bm-time-counter");
			UI.START_BUTTON      = document.getElementById("bm-button-start");
			UI.SETUP_BUTTON      = document.getElementById("bm-button-setup");
			UI.TEAM_SELECT_SLOTS = new TeamSelectSlotGroup(
				document.getElementById("bm-setup-teams"),
				teams
			);
			UI.MENUS             = bpa.createMenuGroup(
				document.getElementById("bm-view-menu")
			);
			UI.SHIP_GRAPHICS     = [];
			UI.isSetupViewOpen   = false;
		}

		function initHandlers () {

			bpa.addEventHandler(
				UI.START_BUTTON,
				"click",
				function () {
					if (!isBattleOngoing) start();
					else stop();
				}
			);

			bpa.addEventHandler(
				UI.SETUP_BUTTON,
				"click",
				function () {
					if (!UI.isSetupViewOpen) {
						UI.BATTLE_VIEW.classList.add("hidden");
						UI.SETUP_VIEW.classList.remove("hidden");
						UI.SETUP_BUTTON.value = "Back";
						UI.isSetupViewOpen    = true;
					}
					else {
						UI.BATTLE_VIEW.classList.remove("hidden");
						UI.SETUP_VIEW.classList.add("hidden");
						UI.SETUP_BUTTON.value = "Setup";
						UI.isSetupViewOpen    = false;
					}
				}
			);

			bpa.addEventHandler(
				document.getElementById("bm-button-team-add"),
				"click",
				newTeam
			);

			bpa.addEventHandler(
				UI.MAP,
				"click",
				function (e) {
					var mapScale  = getMapScale(),
						mapBounds = UI.MAP.getBoundingClientRect(),
						x, y;
					e = e || event;
					x = (e.clientX - mapBounds.left) / mapScale[0];
					y = (e.clientY - mapBounds.top ) / mapScale[1];
					if (x && y) {
						for (var k = 0, kk = selectedShips.length; k < kk; k++) {
							if (selectedShips[k]) selectedShips[k].setDestP(x, y);
						}
					}
				}
			);

			bpa.keyControls.addKey("UP", function (e) {
				//e.preventDefault();
				var i = (selectedShips[0])? selectedShips[0].teamId : 0;
				selectFleet(i, 0);
			});

			bpa.keyControls.addKey("DOWN", function (e) {
				//e.preventDefault();
				for (var k = 0, kk = selectedShips.length; k < kk; k++)
					selectedShips[k].stop();
			});

		}

		function initShipSaveMenu () {
			var shipSaveManagerInstance = shipSaveManager.create(),
				newMenu = UI.MENUS.createMenu(
					shipSaveManagerInstance.elem,
					[
						bpa.createButton("Add",   getShipSelectSlotHandler(shipSaveManagerInstance)),
						bpa.createButton("Close", UI.MENUS.close.bind(UI.MENUS))
					]
				),
				i = UI.MENUS.push(newMenu) - 1;
			newMenu.setHeader("Select Ships");
			UI.openShipMenu          = UI.MENUS.open.bind(UI.MENUS, i);
			UI.selectedFleetSlot     = null;
			UI.selectedShipSlotIndex = 0;
			UI.MENUS.elem.appendChild(newMenu.elem);
		}

		ISTAT    = bpa.ISTAT;
		MAP.type = 0;

		initUI();
		initHandlers();
		initShipSaveMenu();

		UI.TEAM_SELECT_SLOTS.addTeam().addFleet();
		UI.TEAM_SELECT_SLOTS.addTeam().addFleet();

		battleSimulator.init = null;

	}

	//
	// Handlers
	//

	function getShipSelectSlotHandler (shipSaveManagerInstance) {
		return function () {
			UI.selectedFleetSlot.addShip(
				UI.selectedShipSlotIndex,
				shipSaveManagerInstance.selectedShip()
			);
			UI.MENUS.close();
		};
	}

	function clickShip (e) {
		bpa.stopEventPropagation(e);
		if (selectedShips[0] && (this.ship.teamId !== selectedShips[0].teamId)) {
			for (var k = 0, kk = selectedShips.length; k < kk; k++) {
				selectedShips[k].setDestT(this.ship);
			}
		}
		else {
			for (var k = 0, kk = selectedSprites.length; k < kk; k++) {
				if (selectedSprites[k]) selectedSprites[k].classList.remove("focus");
			}
			selectedSprites = [this.sprite];
			selectedShips   = [this.ship];
			this.sprite.classList.add("focus");
		}
	}

	//
	// Data Classes
	//

	/**
	 * Pos
	 *
	 * @constructor
	 * @param {number} [x]
	 * @param {number} [y]
	 */
	function Pos (x, y) {
		if (window.isNaN(x)) x = 0;
		if (window.isNaN(y)) y = 0;
		this.x = x;
		this.y = y;
	}

	/**
	 * Angle
	 *
	 * @constructor
	 * @param {number} [deg] - angle in degrees
	 */
	function Angle (deg) {
		if (window.isNaN(deg)) deg = 0;
		this.deg = deg % this.DEG;
		if (this.deg < 0) this.deg += this.DEG
	}
	Angle.prototype.DEG = 360;

	/**
	 * ShipWeap
	 *
	 * @constructor
	 * @param {number} [j] - weapon index
	 */
	function ShipWeap (j) {
		this.stat       = ISTAT[1][j] || ISTAT[1][0];
		this.nextReload = 0;
	}
	ShipWeap.prototype.isInRange = function (aShip, bShip) {}
	ShipWeap.prototype.fire      = function (aShip, bShip) {}

	/**
	 * Ship
	 *
	 * @constructor
	 * @param {bpa.ShipPlan} [shipPlan]
	 */
	function Ship (shipPlan) { // A built ship

		if (!shipPlan) shipPlan = bpa.createShipPlan();

		this.shipId     = null;
		this.teamId     = null;
		this.stat       = bpa.createShipStat(shipPlan);
		this.isEmpty    = this.stat.plan.getItem(0, 0).id === 0;
		this.pos        = new Pos(0, 0);
		this.direction  = new Angle(0);
		this.dest       = {};
		this.isPursuing = false;
		this.weaps      = [];
		this.relT       = [];

		for (var j = 0, jj = this.stat.plan.slotVals[1].length; j < jj; j++) {
			this.weaps.push(this.stat.plan.getItem(1, j));
			this.relT.push(0);
		}

		this.atkRng = (this.stat.rZon[0])? this.stat.rZon[this.stat.rZon.length - 1].max : 0;

		this.init();
	}
	Ship.prototype.init       = function () {
		this.health = this.stat.armor;
		this.isDead = this.isEmpty;
		for (var j = 0, jj = this.relT.length; j < jj; j++) {
			this.relT[j] = 0;
		}
	};
	Ship.prototype.distance   = function (shipPos) {
		return window.Math.sqrt(
			window.Math.pow(this.pos.x - shipPos.x, 2) +
			window.Math.pow(this.pos.y - shipPos.y, 2)
		);
	};
	Ship.prototype.dAngle     = function (shipPos) {
		var dY = this.pos.y - shipPos.y,
			dX = this.pos.x - shipPos.x;
		return new Angle(180 - (window.Math.atan2(dY, dX) * 180 / window.Math.PI));
	};
	Ship.prototype.setPos     = function (x, y, d) {
		this.pos = new Pos(x, y);
		this.direction = new Angle(d);
	};
	Ship.prototype.setDestP   = function (x, y) {
		this.isPursuing = false;
		this.dest = {pos : new Pos(x, y)};
	};
	Ship.prototype.setDestT   = function (target) {
		this.isPursuing = true;
		this.dest = target;
	};
	Ship.prototype.stop       = function () {
		this.isPursuing = false;
		this.dest = {pos : this.pos};
	};
	Ship.prototype.sail       = function () {
		var x    = this.pos.x,
			y    = this.pos.y,
			d    = this.direction,
			isP  = this.isPursuing,
			dest = this.dest.pos,
			csp  = this.stat.cSpeed,
			tsp  = this.stat.tSpeed,
			dA   = (new Angle(this.dAngle(dest).deg + d.deg)).deg,
			dD   = this.distance(dest),
			nD   = d.deg,
			t    = 1 / FPS,
			// Credits to Benjamin Becker for discovering the following formulas
				// Bases : d = time(in seconds) * combat speed / 4
				// FvF   : d = time(in seconds) * combat speed / 5
			mv   = t * csp / 5;
		if ((!isP && window.Math.floor(dD) > 0) || (isP && window.Math.ceil(dD) > this.atkRng)) {
			// move ship
			if (dA > 0 && dA <= 180) {
				nD -= tsp * t; //CCW
				mv *= (window.Math.pow(180 - dA, 2) / window.Math.pow(180, 2));
			}
			else if (dA > 180) {
				nD += tsp * t; //CW
				mv *= (window.Math.pow(dA - 180, 2) / window.Math.pow(180, 2));
			}
			x += window.Math.cos(nD * (window.Math.PI / 180)) * mv;
			y += window.Math.sin(nD * (window.Math.PI / 180)) * mv;
			this.setPos(x, y, nD);
		}
		else this.stop();
	};
	Ship.prototype.isInRange  = function (weap, target) {
		return weap.isInRange(this.distance(target.pos), this.stat.mods);
	};
	Ship.prototype.findTarget = function (weap) {
		var ship;

		// If dest ship is in range, target dest ship
		if (this.isPursuing && !this.dest.isDead && this.isInRange(weap, this.dest)) {
			return this.dest;
		}

		// Else search for other targets
		for (var i = 0, ii = teams.length; i < ii; i++) {
			if (i === this.teamId) continue;
			for (var j = 0, jj = teams[i].fleets.length; j < jj; j++) {
				for (var k = 0, kk = teams[i].fleets[j].ships.length; k < kk; k++) {
					ship = teams[i].fleets[j].ships[k];
					if (!ship.isDead && this.isInRange(weap, ship)) return ship;
				}
			}
		}

		return null;
	};
	Ship.prototype.fire       = function () {
		var weaps = this.weaps,
			mods  = this.stat.mods,
			relM  = 1,
			target;

		for (var j = 0, jj = weaps.length; j < jj; j++) {
			target = this.findTarget(weaps[j]);
			if (this.relT[j] === 0 && target) {

				// reload gun
				switch (weaps[j].wType) {
					case kWT.CANN : relM = mods.getVal("rlB"); break;
					case kWT.MISS : relM = mods.getVal("rlP"); break;
					//case DTYPE.BAL: relM = mods.relB.val; break;
				}
				this.relT[j] = weaps[j].reload * relM;//console.log(relM);

				// fire!
				target.shot(weaps[j], mods);
			}
		}
	};
	Ship.prototype.reload     = function () {
		var relT = this.relT;
		for (var i = 0, ii = relT.length; i < ii; i++) {
			if (relT[i] > 0) {
				relT[i] -= RELOAD_SPEED / FPS;
				if (relT[i] < 0) relT[i] = 0;
			}
		}
	};
	Ship.prototype.shot       = function (weap, sMods) {
		var dmg    = weap.getDmg(kDT.SHIP, kDT.NON, sMods),
			stat   = this.stat,
			mods   = stat.mods,
			chance = weap.accur * (2 - stat.evade);
		if (this.isDead === true) return;
		switch (weap.dType) {
			case kDT.BAL : dmg *= (1 - stat.defB); chance = weap.accur * (2 - stat.evade); break;
			case kDT.PEN : dmg *= (1 - stat.defP); chance = weap.accur * (2 - stat.evade); break;
			case kDT.RKT : dmg *= (1 - stat.defE); chance = weap.getAccFromSplSpr();       break;
			case kDT.CNC : dmg *= (1 - stat.defC); chance = weap.accur * (2 - stat.evade); break;
		}
		if (chance > 1) chance = 1;
		if (hitOrMiss(chance)) this.health -= dmg;
		if (this.health <= 0) {
			this.isDead = true;
			battleLog("Team " + (this.teamId + 1) + " : Ship " + (this.shipId + 1) + " has sunk");
		}
	};
	Ship.prototype.step       = function () {
		if (this.isDead) return;
		this.sail();
		this.fire();
		this.reload();
	};

	/**
	 * Fleet
	 *
	 * @constructor
	 * @param {Array.<bpa.ShipPlan>} [shipPlans]
	 */
	function Fleet (shipPlans) {
		var newShip;

		this.ships = [];
		this.teamId  = null;

		for (var k = 0; k < MAX_FLEET_SIZE; k++) {
			if (shipPlans && shipPlans[k]) {
				newShip        = new Ship(shipPlans[k], k);
				newShip.isDead = false;
			}
			else {
				newShip        = new Ship(bpa.createShipPlan(), k);
				newShip.isDead = true;
			}
			newShip.teamId = this.teamId;
			this.ships.push(newShip);
		}
		this.isDead = false;
		this.checkIfDead();
	}
	Fleet.prototype.init        = function () {
		var isTeam0 = (this.teamId === 0),
			leadX   = (isTeam0)? MAP.sizeX / 4 : MAP.sizeX * 3 / 4,
			leadY   = MAP.sizeY / 2,
			leadD   = (isTeam0)? 0 : 180,
			teamW   = (isTeam0)? FLEET_WIDTH : -1 * FLEET_WIDTH,
			teamH   = (isTeam0)? FLEET_WIDTH : -1 * FLEET_WIDTH,
			ship;
		this.placeFleet({
			type     : FTYPE.V,
			angle    : (isTeam0)? 180 : 0,
			distance : 100
		});
		for (var i = 0, ii = this.ships.length; i < ii; i++) {
			ship = this.ships[i];
			ship.init();
			ship.setDestP(ship.pos.x + ((isTeam0)? 50 : -50), ship.pos.y);
		}
		this.checkIfDead();
	};
	Fleet.prototype.ship        = function (i, ship) {
		var result = null;
		if (i >= 0 && i < this.ships.length) {
			if (ship instanceof Ship) {
				this.ships[i] = ship;
				this.ships[i].teamId = this.teamId;
				this.ships[i].shipId = i;
			}
			result = this.ships[i];
		}
		return result;
	};
	Fleet.prototype.placeFleet  = function (formation) {
		if (formation.type === FTYPE.V) {
			var fA   = formation.angle,
				fD   = formation.distance,
				cosA = window.Math.cos(fA * (window.Math.PI / 180)),
				sinA = window.Math.sin(fA * (window.Math.PI / 180)),
				lD   = (new Angle(180 - fA)).deg,
				lX   = MAP.sizeX / 2 + cosA * fD,
				lY   = MAP.sizeY / 2 - sinA * fD,
				dY   = cosA * FLEET_WIDTH,
				dX   = sinA * FLEET_WIDTH;
			this.ships[0].setPos(lX              , lY              , lD);
			this.ships[1].setPos(lX + 2 * (dX+dY), lY - 2 * (dX-dY), lD);
			this.ships[2].setPos(lX +     (dX+dY), lY -     (dX-dY), lD);
			this.ships[3].setPos(lX -     (dX-dY), lY -     (dX+dY), lD);
			this.ships[4].setPos(lX - 2 * (dX-dY), lY - 2 * (dX+dY), lD);
		}
		else if (formation.type === FTYPE.M) {
			//var a = formation.aPos = [];
		}
	};
	Fleet.prototype.checkIfDead = function () {
		for (var k = 0, kk = this.ships.length; k < kk; k++) {
			if (!this.ships[k].isDead) {
				return this.isDead = false;
			}
		}
		return this.isDead = true;
	};
	Fleet.prototype.step        = function () {
		if (this.checkIfDead()) return;
		for (var k = 0, kk = this.ships.length; k < kk; k++) {
			this.ships[k].step();
		}
	};

	/**
	 * Team
	 *
	 * @constructor
	 */
	function Team () {
		this.fleets = [];
		this.teamId = teams.length;
		this.isDead = false;
		this.checkIfDead();
	}
	Team.prototype.init        = function () {
		for (var j = 0, jj = this.fleets.length; j < jj; j++) {
			this.fleets[j].init();
		}
		this.checkIfDead();
	}
	Team.prototype.addFleet    = function (fleet) {
		if (!(fleet instanceof Fleet)) fleet = new Fleet();
		fleet.teamId = this.teamId;
		this.fleets.push(fleet);
		return fleet;
	}
	Team.prototype.checkIfDead = function () {
		for (var j = 0, jj = this.fleets.length; j < jj; j++) {
			if (!this.fleets[j].checkIfDead()) {
				return this.isDead = false;
			}
		}
		return this.isDead = true;
	};
	Team.prototype.step        = function () {
		if (this.checkIfDead()) return;
		for (var j = 0, jj = this.fleets.length; j < jj; j++) {
			this.fleets[j].step();
		}
	};

	//
	// DOM Wrapper Classes
	//

	/**
	 * ShipSelectSlot
	 *
	 * @constructor
	 */
	function ShipSelectSlot () {
		var newShipSlot = document.createElement("div"),
			newShipIcon = ISTAT[0][0].createItemIcon();
		newShipSlot.classList.add("ship-icon");
		newShipSlot.appendChild(newShipIcon.elem);

		/**
		 * @member {Element}      ShipSelectSlot.elem
		 * @member {bpa.ItemIcon} ShipSelectSlot.icon
		 */
		this.elem = newShipSlot;
		this.icon = newShipIcon;
	}

	/**
	 * FleetSelectSlot
	 * Controller for modifying fleet setup
	 *
	 * @constructor
	 * @param {Fleet} fleet
	 */
	function FleetSelectSlot (fleet) {
		var newFleetBox = document.createElement("div"),
			newShipSlot;

		/**
		 * @member {Fleet}                  FleetSelectSlot.fleet
		 * @member {Element}                FleetSelectSlot.elem
		 * @member {Array.<ShipSelectSlot>} FleetSelectSlot.children
		 */
		this.fleet    = fleet;
		this.elem     = newFleetBox;
		this.children = [];

		// init
		for (var i = 0; i < MAX_FLEET_SIZE; i++) {
			newShipSlot = new ShipSelectSlot();
			newFleetBox.appendChild(newShipSlot.elem);
			this.children.push(newShipSlot);
		}
		newFleetBox.classList.add("bm-menu-slot-fleet");
		bpa.addEventHandler(newFleetBox, "click", this.clickedFleetSelectSlot.bind(this));
	}
	FleetSelectSlot.prototype.addShip                = function (k, shipPlan) {
		var ship = new Ship(shipPlan, k);
		this.fleet.ship(k, ship);
		this.children[k].icon.setItemImg(shipPlan.slotVals[0][0]);
		return this.children[k];
	};
	FleetSelectSlot.prototype.selectShipSelectSlot   = function (k) {
		UI.selectedFleetSlot     = this;
		UI.selectedShipSlotIndex = k;
		UI.openShipMenu();
	};
	FleetSelectSlot.prototype._find                  = function (elem) {
		for (var i = 0; i < this.children.length; i++) {
			if (elem === this.children[i].elem) {
				return i;
			}
		}
		return -1;
	};
	FleetSelectSlot.prototype.clickedFleetSelectSlot = function (e) {
		var T = e.target,
			i = -1;
		while (i === -1 && T !== this.elem) {
			i = this._find(T);
			T = T.parentNode;
		}
		if (i !== -1) {
			this.selectShipSelectSlot(i);
		}
	}

	/**
	 * TeamSelectSlot
	 * Controller for modifying team setup
	 *
	 * @constructor
	 * @param {Team} team
	 */
	function TeamSelectSlot (team) {
		var newTeamBox = document.createElement("div"),
			newButton  = document.createElement("input");
		newTeamBox.classList.add("bm-menu-slot-team");
		newButton.type  = "button";
		newButton.value = "New Fleet";
		newButton.classList.add("button-small");
		bpa.addEventHandler(newButton, "click", this.addFleet.bind(this));
		newTeamBox.appendChild(newButton);

		/**
		 * @member {Team}                    TeamSelectSlot.team
		 * @member {Element}                 TeamSelectSlot.elem
		 * @member {Array.<FleetSelectSlot>} TeamSelectSlot.children
		 */
		this.team     = team;
		this.elem     = newTeamBox;
		this.children = [];
	}
	TeamSelectSlot.prototype.addFleet = function (fleet) {
		var newFleetSelectSlot;
		if (!(fleet instanceof Fleet)) fleet = new Fleet();
		this.team.addFleet(fleet);
		newFleetSelectSlot = new FleetSelectSlot(fleet);
		this.elem.appendChild(newFleetSelectSlot.elem);
		this.children.push(newFleetSelectSlot);
		return newFleetSelectSlot;
	};

	/**
	 * TeamSelectSlotGroup
	 *
	 * @constructor
	 * @param {Element} elem
	 */
	function TeamSelectSlotGroup (elem, teams) {
		/**
		 * @member {Element}            TeamSelectSlotGroup.elem
		 * @member {Array.<Team>}       TeamSelectSlotGroup.teams
		 * @member {Array.<TeamSelectSlot>} TeamSelectSlotGroup.children
		 * @member {TeamSelectSlot|null}    TeamSelectSlotGroup.selected
		 */
		this.elem     = elem;
		this.teams    = teams;
		this.children = [];
		this.selected = null;
	}
	TeamSelectSlotGroup.prototype.addTeam = function (team) {
		var newTeamSelectSlot;
		if (!(team instanceof Team)) team = new Team();
		this.teams.push(team);
		newTeamSelectSlot = new TeamSelectSlot(team);
		this.elem.appendChild(newTeamSelectSlot.elem);
		this.children.push(newTeamSelectSlot);
		return newTeamSelectSlot;
	};
	TeamSelectSlotGroup.prototype.select  = function (i) {
		if (this.selected) this.selected.elem.classList.remove("focus");
		this.selected = this.children[i];
		if (this.selected) this.selected.elem.classList.add("focus");
	};
	TeamSelectSlotGroup.prototype.at      = function (i) {
		return this.children[i] || null;
	};

	/**
	 * ShipGraphic
	 *
	 * @constructor
	 * @param {number} i - team index
	 * @param {number} j - fleet index
	 * @param {number} k - ship index
	 */
	function ShipGraphic (i, j, k) {
		var sprite = document.createElement("div"),
			health = bpa.createCapacityBar(),
			elem   = document.createElement("div"),
			upper  = document.createElement("div"),
			lower  = document.createElement("div"),
			bar    = health.elem;
		elem  .classList.add("bm-ship-graphic");
		upper .classList.add("bm-ship-graphic-upper");
		lower .classList.add("bm-ship-graphic-lower");
		sprite.classList.add("bm-sprite-ship");
		bar   .classList.add("mini");
		sprite.title = "Team " + (i + 1) + " : Ship " + (k + 1);
		bpa.addEventHandler(sprite, "click", clickShip.bind(this));
		upper.appendChild(sprite);
		lower.appendChild(bar);
		elem.appendChild(upper);
		elem.appendChild(lower);

		/**
		 * @member {Element}         ShipGraphic.elem
		 * @member {Element}         ShipGraphic.sprite
		 * @member {bpa.CapacityBar} ShipGraphic.health
		 * @member {Ship}            ShipGraphic.ship
		 */
		this.elem   = elem;
		this.sprite = sprite;
		this.health = health;
		this.ship   = teams[i].fleets[j].ships[k];

		this.setSprite(i, k);
	}
	ShipGraphic.prototype.remove    = function () {bpa.removeElement(this.elem);};
	ShipGraphic.prototype.setSprite = function (i, k) {
		var coordX = -SPRITE_W * i,
			coordY = -SPRITE_H * k;
		this.sprite.style.backgroundPosition = coordX + "px " + coordY + "px";
	};
	ShipGraphic.prototype.setPos    = function (x, y, d) {
		this.elem.style.left = (x - 30) + "px";
		this.elem.style.top  = (y - 30) + "px";
		rotateElem(this.sprite, d);
	};

	//
	// Helper functions
	//

	/**
	 * Determines whether an attack succeeded or not.
	 *
	 * @param {number} n - a probability between 0 and 1
	 * @returns {bool} hit
	 */
	function hitOrMiss (n) {return window.Math.random() < n;}

	/**
	 * Get map scale.
	 *
	 * @returns {Array.<number>} [xFactor, yFactor]
	 */
	function getMapScale () {
		return [
			UI.MAP.getBoundingClientRect().width  / MAP.sizeX,
			UI.MAP.getBoundingClientRect().height / MAP.sizeY
		];
	}

	/**
	 * Rotate an element.
	 *
	 * @param {Element} elem
	 * @param {number} deg
	 */
	function rotateElem (elem, deg) {
		// cross browser?
		elem.style.webkitTransform = "rotate(" + deg + "deg)";
	}

	/**
	 * Creates a new team.
	 *
	 * @returns {Team} team
	 */
	function newTeam () {return UI.TEAM_SELECT_SLOTS.addTeam();}

	/**
	 * Get fleet.
	 *
	 * @param {number} i - team index
	 * @param {number} j - fleet index
	 * @returns {Fleet} fleet
	 */
	function getFleet (i, j) {return teams[i].fleets[j];}

	/**
	 * Select fleet.
	 *
	 * @param {number} i - team index
	 * @param {number} j - fleet index
	 */
	function selectFleet (i, j) {
		selectedShips   = [];
		selectedSprites = [];
		for (var k = 0, kk = teams[i].fleets[j].ships.length; k < kk; k++) {
			if (!teams[i].fleets[j].ships[k].isDead) {
				selectedShips.push(teams[i].fleets[j].ships[k]);
				selectedSprites.push(UI.SHIP_GRAPHICS[i][j][k].sprite);
				selectedSprites[k].classList.add("focus");
			}
		}
	}

	/**
	 * Change FPS.
	 *
	 * @param {number} n
	 */
	function setFPS (n) {if (n > 0 && n <= 60) FPS = n;}

	/**
	 * Output to battle log.
	 *
	 * @param {string} s
	 */
	function battleLog (s) {
		UI.LOG.appendChild(document.createTextNode(s));
		UI.LOG.appendChild(document.createElement("br"));
	}

	//
	// Main functions
	//

	function start () {

		MAP.type = 0;
		if (MAP.type === 0) teams.length = 2;
		for (var i = 0, ii = teams.length; i < ii; i++) {
			teams[i].init();
		}

		initShipSprites();
		timeElapsed = 0;
		isBattleOngoing = true;
		UI.START_BUTTON.value = "Stop";
		battleLog("Battle has started");
		stepForward();

	}

	function initShipSprites () {
		var shipGraphic;

		selectedShips    = [];
		selectedSprites  = [];
		UI.SHIP_GRAPHICS = [];
		bpa.removeAllChildren(UI.MAP);

		for (var i = 0, ii = teams.length; i < ii; i++) {
			UI.SHIP_GRAPHICS[i] = [];
			for (var j = 0, jj = teams[i].fleets.length; j < jj; j++) {
				UI.SHIP_GRAPHICS[i].push([]);
				for (var k = 0, kk = teams[i].fleets[j].ships.length; k < kk; k++) {
					shipGraphic = new ShipGraphic(i, j, k);
					UI.SHIP_GRAPHICS[i][j].push(shipGraphic);
					UI.MAP.appendChild(shipGraphic.elem);
				}
			}
		}
	}

	function drawShipSprites () {
		var mapScale = getMapScale(),
			shipGraphic,
			ship;

		for (var i = 0, ii = teams.length; i < ii; i++) {
			for (var j = 0, jj = teams[i].fleets.length; j < jj; j++) {
				for (var k = 0, kk = teams[i].fleets[j].ships.length; k < kk; k++) {
					ship   = teams[i].fleets[j].ships[k];
					shipGraphic = UI.SHIP_GRAPHICS[i][j][k];
					if (teams[i].fleets[j].ships[k].isDead)
						shipGraphic.elem.classList.add("hidden");
					else {
						shipGraphic.setPos(
							ship.pos.x * mapScale[0],
							ship.pos.y * mapScale[1],
							ship.direction.deg
						);
						shipGraphic.health.setVal(ship.health, ship.stat.armor);
					}
				}
			}
		}
	}

	function stepForward () {
		for (var i = 0, ii = teams.length; i < ii; i++) {
			teams[i].step();
		}
		drawShipSprites();
		timeElapsed += SECOND / FPS;
		if (timeElapsed % SECOND === 0) {
			bpa.setTextNode(UI.TIME_COUNTER, timeElapsed / SECOND)
		}
		currentStep = window.setTimeout(stepForward, SECOND / FPS);
		if (timeElapsed >= TIME_LIMIT) stop();
		checkIfWon();
	}

	function checkIfWon () {
		var survivors = 0,
			winner    = 0;
		for (var i = 0, ii = teams.length; i < ii; i++) {
			if (!teams[i].checkIfDead()) {
				survivors++;
				winner = i;
			}
		}
		if (survivors <= 1) {
			battleLog("Team " + (winner + 1) + " has won");
			stop();
		}
	}

	function stop () {
		clearTimeout(currentStep);
		isBattleOngoing = false;
		UI.START_BUTTON.value = "Start";
		battleLog("Battle has ended");
	}

	//
	// Export
	//

	return {
		init     : init,
		start    : start,
		stop     : stop,
		getFleet : getFleet,
		setFPS   : setFPS
	};

})();

//-//--0in//
//
// INIT
//
//-////////////////

bpa.addEventHandler(document, "DOMContentLoaded", function () {
	bpa.init();
	grapher.init();
	dataTable.init();
	shipCodeGenerator.init();
	shipSaveManager.init();
	bestCalculator.init();
	shipYard.init();
	battleSimulator.init();
	bpa.shroud(false);
});

// BPSC Namespace End

})(window, document);

//-//--0nt//
//
// NOTES
//
//-////////////////

/*

TODO
-> Build Time and Cost Data
-> Cost in FB credits
-> Sprites
-> Refit Mode
-> Retrofit
-> Rogue Crews
-> find best+ specials
-> find best+ shroud
-> Ship() dmg chart
-> Battle attack time delay B*2.5=M?
-> Battle Map

TIPS
-> createDocumentFragment() when adding many elements
-> e.preventDefault() to stop events

*/

