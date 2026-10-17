import mongoose, { Schema } from "mongoose";

const campaignSchema = new Schema({
	title: {
		type: String,
		required: true,
	},
	project_image: {
		type: String,
		required: true,
	},
	project_name: {
		type: String,
		required: true,
		default: "Nexura"
	},
	description: {
		type: String,
		required: true,
	},
	starts_at: {
		type: String,
		required: true,
	},
	totalXpAvailable: {
		type: Number,
		required: true,
	},
	xpClaimed: {
		type: Number,
		default: 0,
	},
	totalTrustAvailable: {
		type: Number,
		required: true,
	},
	trustClaimed: {
		type: Number,
		default: 0,
	},
	ends_at: {
		type: String,
		required: true,
	},
	participants: {
		type: Number,
		default: 0,
	},
	maxParticipants: {
		type: Number,
		default: 0,
	},
	sub_title: {
		type: String,
		required: true,
	},
	campaignNumber: {
		type: Number,
		required: true,
	},
	status: {
		type: String,
		default: "Save",
		enum: ["Active", "Scheduled", "Ended", "Save", "Deleted"],
	},
	deletedAt: {
		type: Date,
		default: null,
	},
	discordLaunchGuildId: {
		type: String,
		default: "",
	},
	contractAddress: {
		type: String,
	},
	rewardsDeployment: {
		txHash: {
			type: String,
		},
		fundedAmount: {
			type: Number,
		},
		rewardPerParticipant: {
			type: Number,
		},
		maxClaimableParticipants: {
			type: Number,
		},
		remainderWithdrawalTxHash: {
			type: String,
		},
		remainderWithdrawnAmount: {
			type: Number,
		},
		remainderWithdrawnAt: {
			type: Date,
		},
	},
	reward: {
		xp: {
			type: Number,
			required: true,
		},
		trustTokens: {
			type: Number,
			default: 0,
		},
		pool: {
			type: Number,
			required: true
		}
	},
	noOfQuests: {
		type: Number,
		default: 0,
	},
	projectCoverImage: {
		type: String,
		required: true,
	},
	hub: {
		type: mongoose.Schema.Types.ObjectId,
    ref: "hubs",
		required: true
	},
	// ── Retention campaign builder (Create Campaign) ──
	templateId: {
		type: String,
		default: null,
	},
	// Journey stages, in order. Each campaign quest points at a stage by `key`.
	stages: [{
		_id: false,
		key: { type: String, required: true },
		name: { type: String, required: true },
		order: { type: Number, default: 0 },
		returnDays: { type: Number, default: 0 },
		allocationPct: { type: Number, default: null },
	}],
	rewardsEnabled: {
		type: Boolean,
		default: false,
	},
	// What the project set on the Rewards & Funding step
	rewardsConfig: {
		budget: { type: Number },
		token: { type: String },
		network: { type: String },
		recipients: { type: Number },
		retentionRequirementPct: { type: Number },
		participantPool: { type: Number },
		validationRewardsOn: { type: Boolean },
		curatorRewardsOn: { type: Boolean },
		curatorAddress: { type: String },
		totalPaid: { type: Number },
		paymentTxHash: { type: String },
	},
	// Everything the Create Campaign builder needs to reopen a draft exactly where it was left
	// (field values, current step, reward settings). Owned by the studio client.
	builderState: {
		type: Schema.Types.Mixed,
		default: null,
	},
	// Set when an approved governance proposal schedules this campaign to end
	endProposal: {
		ref: { type: String },
		executedAt: { type: Date },
		endsAt: { type: String },
	},
	// Wallet signature of the admin who published the campaign
	publishSignature: {
		address: { type: String },
		signature: { type: String },
		message: { type: Schema.Types.Mixed },
		adminId: { type: String },
		signedAt: { type: Date },
	},
}, { timestamps: true });

export const campaign = mongoose.model("campaigns", campaignSchema);

const campaignCompletedSchema = new Schema({
	questsCompleted: {
		type: Boolean,
		default: false,
	},
	campaignCompleted: {
		type: Boolean,
		default: false,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "user",
	},
	campaign: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "campaign",
	},
	// Retention on this campaign: stages fully completed out of all stages (see utils/retention.ts)
	stagesCompleted: { type: Number, default: 0 },
	stagesTotal: { type: Number, default: 0 },
	retentionRate: { type: Number, default: null },
}, { timestamps: true });

export const campaignCompleted = mongoose.model(
	"completed-campaigns",
	campaignCompletedSchema
);
