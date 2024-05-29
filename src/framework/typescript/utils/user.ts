/*
 * This file is part of SudoBot.
 *
 * Copyright (C) 2021-2024 OSN Developers.
 *
 * SudoBot is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * SudoBot is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with SudoBot. If not, see <https://www.gnu.org/licenses/>.
 */

import { emoji } from "@framework/utils/emoji";
import { client } from "@framework/utils/helpers";
import type { GuildMember, User } from "discord.js";
import { TimestampStyles, UserFlags, time } from "discord.js";

const map: Record<string, [string, string]> = {
    BugHunterLevel1: ["bughunter", "Bughunter Level 1"],
    BugHunterLevel2: ["golden_bughunter", "Bughunter Level 2"],
    CertifiedModerator: ["certified_mod", "Discord Certified Moderator"],
    Staff: ["discord_staff", "Discord Staff"],
    PremiumEarlySupporter: ["early_supporter", "Early Nitro Supporter"],
    VerifiedDeveloper: ["verified_bot_developer", "Early Verified Bot Developer"],
    HypeSquadOnlineHouse1: ["bravery", "HypeSquad Bravery"],
    HypeSquadOnlineHouse2: ["brilliance", "HypeSquad Brilliance"],
    HypeSquadOnlineHouse3: ["balance", "HypeSquad Balance"],
    Hypesquad: ["hypesquad_events", "HypeSquad Events"],
    Partner: ["partnered_server_owner", "Partnered Server Owner"],
    VerifiedBot: ["verified_bot", "Verified Bot"],
    BotHTTPInteractions: ["supports_interactions", "Supports Interactions"],
    ActiveDeveloper: ["active_developer", "Active Developer"]
};

export const getUserBadges = (user: User) => {
    const badges = [];

    for (const flagString in map) {
        const [emojiName, badgeTitle] = map[flagString];
        const flag = UserFlags[flagString as keyof typeof UserFlags];

        if (flag && user.flags?.has(flag)) {
            const guildEmoji = emoji(client(), emojiName);
            badges.push(`${guildEmoji ?? ""} ${badgeTitle}`);
        }
    }

    if (user.discriminator === "0") {
        badges.push(`${emoji(client(), "new_username")} Has opted-in to the new username system`);
    }

    return badges;
};

export const getMemberBadges = (member: GuildMember) => {
    const badges = getUserBadges(member.user);

    if (
        member.premiumSinceTimestamp ||
        client().guilds.cache.some(
            guild => !!guild.members.cache.get(member.id)?.premiumSinceTimestamp
        )
    ) {
        badges.push(`${emoji(client(), "nitro")} Nitro Subscriber`);
    }

    let minPremiumSince = member.premiumSince;

    for (const guild of client().guilds.cache.values()) {
        const guildMember = guild.members.cache.get(member.id);

        if (
            guildMember &&
            guildMember.premiumSince &&
            (minPremiumSince?.getTime() ?? 0) > (guildMember.premiumSince?.getTime() ?? 0)
        ) {
            minPremiumSince = guildMember.premiumSince;
        }
    }

    if (minPremiumSince) {
        badges.push(
            `${emoji(client(), "boost")} Server boosting since ${time(minPremiumSince, TimestampStyles.LongDate)}`
        );
    }

    return badges;
};
