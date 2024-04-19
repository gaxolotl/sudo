import { TakesArgument } from "@framework/arguments/ArgumentTypes";
import { ErrorType } from "@framework/arguments/InvalidArgumentError";
import RestStringArgument from "@framework/arguments/RestStringArgument";
import StringArgument from "@framework/arguments/StringArgument";
import UserArgument from "@framework/arguments/UserArgument";
import { Command, CommandMessage } from "@framework/commands/Command";
import Context from "@framework/commands/Context";
import { Inject } from "@framework/container/Inject";
import Duration from "@framework/datetime/Duration";
import { Colors } from "@main/constants/Colors";
import InfractionManager from "@main/services/InfractionManager";
import PermissionManagerService from "@main/services/PermissionManagerService";
import { Infraction, InfractionType } from "@prisma/client";
import { User, italic, time } from "discord.js";

type InfractionCreateCommandArgs = {
    user: User;
    type: string;
    reason?: string;
};

@TakesArgument<InfractionCreateCommandArgs>({
    names: ["user"],
    types: [UserArgument<true>],
    optional: false,
    errorMessages: [UserArgument.defaultErrors],
    interactionName: "user",
    interactionType: UserArgument<true>
})
@TakesArgument<InfractionCreateCommandArgs>({
    names: ["type"],
    types: [StringArgument],
    optional: false,
    errorMessages: [
        {
            [ErrorType.InvalidType]: "Invalid infraction type provided.",
            [ErrorType.Required]: "Infraction type is required."
        }
    ],
    interactionName: "type",
    interactionType: StringArgument
})
@TakesArgument<InfractionCreateCommandArgs>({
    names: ["reason"],
    types: [RestStringArgument],
    optional: true,
    errorMessages: [
        {
            [ErrorType.InvalidType]: "Invalid reason provided."
        }
    ],
    interactionName: "reason",
    interactionType: RestStringArgument
})
class InfractionCreateCommand extends Command {
    public override readonly name = "infraction::create";
    public override readonly description: string = "Create a new infraction.";

    @Inject()
    protected readonly infractionManager!: InfractionManager;

    @Inject()
    protected readonly permissionManager!: PermissionManagerService;

    public override async execute(
        context: Context<CommandMessage>,
        args: InfractionCreateCommandArgs
    ): Promise<void> {
        const { type: rawType, user, reason } = args;
        const type = rawType.toUpperCase();

        if (!Object.values(InfractionType).includes(type as InfractionType)) {
            await context.error("Invalid infraction type provided.");
            return;
        }

        const durationString = context.isChatInput()
            ? context.options.getString("duration")
            : undefined;
        const duration = durationString
            ? Duration.fromDurationStringExpression(durationString)
            : undefined;
        const notify = context.isChatInput() && !!context.options.getBoolean("notify");

        const infraction: Infraction = await this.infractionManager.createInfraction({
            type: type as InfractionType,
            user,
            guildId: context.guild.id,
            moderator: context.user,
            reason,
            notify,
            generateOverviewEmbed: false,
            processReason: true,
            sendLog: false,
            payload: {
                expiresAt: duration?.fromNow(),
                metadata: duration
                    ? {
                          duration: duration?.fromNowMilliseconds()
                      }
                    : undefined
            }
        });

        const fields = [
            {
                name: "Type",
                value: infraction.type
                    .split("_")
                    .map(s => s[0].toUpperCase() + s.slice(1))
                    .join(" ")
            },
            {
                name: "User",
                value: infraction.userId,
                inline: true
            },
            {
                name: "Moderator",
                value: infraction.moderatorId,
                inline: true
            },
            {
                name: "Reason",
                value: infraction.reason ?? italic("No reason provided")
            },
            {
                name: "Created At",
                value: time(infraction.createdAt, "R"),
                inline: true
            },
            {
                name: "Updated At",
                value: time(infraction.updatedAt, "R"),
                inline: true
            }
        ];

        if (infraction.expiresAt) {
            fields.push({
                name: "Expires At",
                value: time(infraction.expiresAt, "R"),
                inline: true
            });
        }

        fields.push({
            name: "Notification Status",
            value: infraction.deliveryStatus
                .split("_")
                .map(s => s[0].toUpperCase() + s.slice(1))
                .join(" ")
        });

        await context.reply({
            embeds: [
                {
                    title: `Infraction #${infraction.id}`,
                    fields,
                    color: Colors.Primary,
                    timestamp: new Date().toISOString()
                }
            ]
        });
    }
}

export default InfractionCreateCommand;
