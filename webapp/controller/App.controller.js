sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType",
], function (Controller, MessageToast, MessageBox, JSONModel,Filter,FilterOperator,FilterType) {
	"use strict";

	return Controller.extend("sap.ui.core.tutorial.odatav4.controller.App", {

		/**
		 *  Hook for initializing the controller
		 */
		onInit : function () {
			var oMessageManager = sap.ui.getCore().getMessageManager(),
				oMessageModel = oMessageManager.getMessageModel(),
				oMessageModelBinding = oMessageModel.bindList("/", undefined, [],
					new Filter("technical", FilterOperator.EQ, true)),
				oViewModel = new JSONModel({
					busy : false,
					hasUIChanges : false,
					usernameEmpty : false,
					order : 0
				});
			this.getView().setModel(oViewModel, "appView");
			this.getView().setModel(oMessageModel, "message");

			oMessageModelBinding.attachChange(this.onMessageBindingChange, this);
			this._bTechnicalErrors = false;
},

onCreate : function () {
	var oList = this.byId("productList"),
		oBinding = oList.getBinding("items"),
		oContext = oBinding.create({
			"p_id" : "",
			"name" : "",
			"costPrice" : "",
			"sellPrice" : ""
		});

	this._setUIChanges();
	this.getView().getModel("appView").setProperty("/usernameEmpty", true);

	oList.getItems().some(function (oItem) {
		if (oItem.getBindingContext() === oContext) {
			oItem.focus();
			oItem.setSelected(true);
			return true;
		}
	});
},
onSave : function () {
	var fnSuccess = function () {
		this._setBusy(false);
		MessageToast.show(this._getText("changesSentMessage"));
		this._setUIChanges(false);
	}.bind(this);

	var fnError = function (oError) {
		this._setBusy(false);
		this._setUIChanges(false);
		MessageBox.error(oError.message);
	}.bind(this);

	this._setBusy(true); // Lock UI until submitBatch is resolved.
	this.getView().getModel().submitBatch("peopleGroup").then(fnSuccess, fnError);
	this._bTechnicalErrors = false; // If there were technical errors, a new save resets them.
},
onMessageBindingChange : function (oEvent) {
	var aContexts = oEvent.getSource().getContexts(),
		aMessages,
		bMessageOpen = false;

	if (bMessageOpen || !aContexts.length) {
		return;
	}

	// Extract and remove the technical messages
	aMessages = aContexts.map(function (oContext) {
		return oContext.getObject();
	});
	sap.ui.getCore().getMessageManager().removeMessages(aMessages);

	this._setUIChanges(true);
	this._bTechnicalErrors = true;
	MessageBox.error(aMessages[0].message, {
		id : "serviceErrorMessageBox",
		onClose : function () {
			bMessageOpen = false;
		}
	});

	bMessageOpen = true;
},
onDelete : function () {
	var oContext,
		oSelected = this.byId("productList").getSelectedItem(),
		sUserName;

	if (oSelected) {
		oContext = oSelected.getBindingContext();
		sUserName = oContext.getProperty("UserName");
		oContext.delete().then(function () {
			MessageToast.show(this._getText("deletionSuccessMessage", sUserName));
		}.bind(this), function (oError) {
			this._setUIChanges();
			if (oError.canceled) {
				MessageToast.show(this._getText("deletionRestoredMessage", sUserName));
				return;
			}
			MessageBox.error(oError.message + ": " + sUserName);
		}.bind(this));
		this._setUIChanges(true);
	}
},

onInputChange : function (oEvt) {
	if (oEvt.getParameter("escPressed")) {
		this._setUIChanges();
	} else {
		this._setUIChanges(true);
		if (oEvt.getSource().getParent().getBindingContext().getProperty("p_id")) {
			this.getView().getModel("appView").setProperty("/usernameEmpty", false);
		}
	}
},

_setUIChanges : function (bHasUIChanges) {
	if (this._bTechnicalErrors) {
		// If there is currently a technical error, then force 'true'.
		bHasUIChanges = true;
	} else if (bHasUIChanges === undefined) {
		bHasUIChanges = this.getView().getModel().hasPendingChanges();
	}
	var oModel = this.getView().getModel("appView");
	oModel.setProperty("/hasUIChanges", bHasUIChanges);
},
_setBusy : function (bIsBusy) {
	var oModel = this.getView().getModel("appView");
	oModel.setProperty("/busy", bIsBusy);
},
_getText : function (sTextId, aArgs) {
	return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sTextId, aArgs);

}


	});
});
