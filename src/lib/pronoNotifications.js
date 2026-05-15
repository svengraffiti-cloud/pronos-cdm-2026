export async function askNotificationPermission() {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function schedulePronoNotifications() {
  // SÉCURITÉ ANTI-SPAM
  // Notifications automatiques désactivées temporairement.
  // On ne programme aucune notification depuis le téléphone.
  return;
}

export function clearOldPronoNotifications() {
  if (typeof window === "undefined") return;

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("pronos_papy_notification_")) {
      localStorage.removeItem(key);
    }
  });
}  if (typeof window === "undefined") return;

  localStorage.setItem(
    getNotificationKey(userId, matchId, type),
    "sent"
  );
}

function userHasPredicted(matchId, predictions = []) {
  return predictions.some(
    (prediction) => String(prediction.matchId) === String(matchId)
  );
}

function sendBrowserNotification({ title, body }) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });
}

export async function askNotificationPermission() {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function schedulePronoNotifications({
  userId = "guest",
  matches = [],
  predictions = [],
}) {
  if (typeof window === "undefined") return;

  const now = Date.now();

  matches.forEach((match) => {
    if (!match?.id || !match?.kickoff) return;

    const kickoffTime = new Date(match.kickoff).getTime();

    if (Number.isNaN(kickoffTime)) return;

    // MATCH PASSÉ = RIEN
    if (kickoffTime <= now) return;

    // JOUEUR A DÉJÀ PRONOSTIQUÉ = RIEN
    if (userHasPredicted(match.id, predictions)) return;

    REMINDERS.forEach((reminder) => {
      const notificationTime =
        kickoffTime - reminder.offsetMinutes * 60 * 1000;

      // SI LE RAPPEL EST DÉJÀ PASSÉ => RIEN
      if (notificationTime <= now) return;

      if (
        hasNotificationAlreadyBeenSent(
          userId,
          match.id,
          reminder.type
        )
      ) {
        return;
      }

      const delay = notificationTime - now;

      // SÉCURITÉ ANTI-SPAM
      if (delay < 60000) return;

      setTimeout(() => {
        if (userHasPredicted(match.id, predictions)) return;

        if (
          hasNotificationAlreadyBeenSent(
            userId,
            match.id,
            reminder.type
          )
        ) {
          return;
        }

        sendBrowserNotification({
          title: reminder.title,
          body: `${reminder.body} (${match.home_team || ""} vs ${
            match.away_team || ""
          })`,
        });

        markNotificationAsSent(
          userId,
          match.id,
          reminder.type
        );
      }, delay);
    });

    const tooLateType = "TOO_LATE";
    const tooLateTime = kickoffTime + 60 * 1000;

    if (tooLateTime <= now) return;

    if (
      hasNotificationAlreadyBeenSent(
        userId,
        match.id,
        tooLateType
      )
    ) {
      return;
    }

    const tooLateDelay = tooLateTime - now;

    if (tooLateDelay < 60000) return;

    setTimeout(() => {
      if (userHasPredicted(match.id, predictions)) return;

      sendBrowserNotification({
        title: "Trop tard 😭",
        body: "Désolé trop tard, bouge-toi la prochaine fois ! Si tu veux pas finir dans le Loft comme à Chelsea.",
      });

      markNotificationAsSent(
        userId,
        match.id,
        tooLateType
      );
    }, tooLateDelay);
  });
}
  const key = getNotificationKey(userId, matchId, type);
  localStorage.setItem(key, "sent");
}

function userHasPredicted(matchId, predictions = []) {
  return predictions.some((prediction) => {
    return String(prediction.matchId) === String(matchId);
  });
}

function sendBrowserNotification({ title, body }) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });
}

export async function askNotificationPermission() {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function schedulePronoNotifications({
  userId = "guest",
  matches = [],
  predictions = [],
}) {
  if (typeof window === "undefined") return;
  if (!Array.isArray(matches)) return;

  const now = Date.now();

  matches.forEach((match) => {
    if (!match?.id || !match?.kickoff) return;

    const kickoffTime = new Date(match.kickoff).getTime();

    if (Number.isNaN(kickoffTime)) return;

    if (userHasPredicted(match.id, predictions)) return;

    REMINDERS.forEach((reminder) => {
      const notificationTime =
        kickoffTime - reminder.offsetMinutes * 60 * 1000;

      if (notificationTime <= now) return;

      if (hasNotificationAlreadyBeenSent(userId, match.id, reminder.type)) {
        return;
      }

      const delay = notificationTime - now;

      setTimeout(() => {
        if (userHasPredicted(match.id, predictions)) return;

        if (hasNotificationAlreadyBeenSent(userId, match.id, reminder.type)) {
          return;
        }

        sendBrowserNotification({
          title: reminder.title,
          body: reminder.body,
        });

        markNotificationAsSent(userId, match.id, reminder.type);
      }, delay);
    });

    const tooLateType = "TOO_LATE";
    const tooLateTime = kickoffTime + 60 * 1000;

    if (tooLateTime > now) {
      if (!hasNotificationAlreadyBeenSent(userId, match.id, tooLateType)) {
        const delay = tooLateTime - now;

        setTimeout(() => {
          if (userHasPredicted(match.id, predictions)) return;

          if (hasNotificationAlreadyBeenSent(userId, match.id, tooLateType)) {
            return;
          }

          sendBrowserNotification({
            title: "Trop tard 😭",
            body: "Désolé trop tard, bouge-toi la prochaine fois ! Si tu veux pas finir dans le Loft comme à Chelsea.",
          });

          markNotificationAsSent(userId, match.id, tooLateType);
        }, delay);
      }
    }
  });
}

export function clearOldPronoNotifications() {
  if (typeof window === "undefined") return;

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(NOTIFICATION_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}
