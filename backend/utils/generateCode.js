const generateInviteCode = (length = 8) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excludes O, 0, I, 1
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
};

export default generateInviteCode;

export async function ensurePatientInviteCode(prisma, patientId, opts = {}) {
  const { forceRegenerate = false } = opts;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { inviteCode: true },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  if (patient.inviteCode && !forceRegenerate) {
    // Already has a code, no change
    return patient.inviteCode;
  }

  const newCode = generateInviteCode();
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      inviteCode: newCode,
      inviteUpdatedAt: new Date(),
    },
  });
  return newCode;
}
