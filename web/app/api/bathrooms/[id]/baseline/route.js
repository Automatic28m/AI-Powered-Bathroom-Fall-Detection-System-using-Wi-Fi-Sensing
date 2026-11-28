// /api/bathrooms/:id/baseline: POST upload a new baseline (WA-9, WA-12). Admin only.
// multipart/form-data: "baseline" (.npy file, required), "recordedAt" (optional ISO date).
// The new file becomes the current baseline; old files and rows are kept as history.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ApiError, formFields, parseId, readForm, withApi } from '@/lib/api'
import { readBaselineFile, removeFiles, saveBaseline } from '@/lib/baselines'
import { BATHROOM_LIST_SELECT, getRecalibrationMonths, toBathroomItem } from '@/lib/bathrooms'
import { requireApiRole } from '@/lib/session'
import { baselineUploadSchema } from '@/lib/validators/bathroom'

export const POST = withApi(async (request, { params }) => {
  const actor = await requireApiRole('admin')
  const id = parseId((await params).id)
  const form = await readForm(request)
  const { recordedAt } = baselineUploadSchema.parse(formFields(form, ['recordedAt']))
  const bytes = await readBaselineFile(form.get('baseline'))

  const bathroom = await db.bathroom.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!bathroom) throw new ApiError(404, 'NOT_FOUND', 'ไม่พบห้องน้ำนี้')

  /** @type {string[]} */
  const written = []
  try {
    await db.$transaction(
      (tx) =>
        saveBaseline(tx, { bathroom, bytes, recordedAt: recordedAt ?? new Date(), actor, written }),
      { timeout: 15000 }
    )
  } catch (err) {
    await removeFiles(written)
    throw err
  }

  const [row, months] = await Promise.all([
    db.bathroom.findUniqueOrThrow({ where: { id }, select: BATHROOM_LIST_SELECT }),
    getRecalibrationMonths(),
  ])
  return NextResponse.json(toBathroomItem(row, months), { status: 201 })
})
