export const ALL_MUNICIPALITIES = 'All Municipalities'

export const MUNICIPALITIES = [
  'Ampatuan',
  'Buluan',
  'Datu Abdullah Sangki (DAS)',
  'Datu Blah Sinsuat (DBS)',
  'Datu Hoffer',
  'Datu Montawal',
  'Datu Odin Sinsuat (DOS)',
  'Datu Paglas',
  'Datu Piang',
  'Datu Saudi Ampatuan',
  'Gen. S.K. Pendatun',
  'Mamasapano',
  'Mangudadatu',
  'Northern Kabuntalan',
  'Pagalungan',
  'Parang',
  'Rajah Buayan',
  'Shariff Aguak',
  'Shariff Saydona',
  'South Upi',
  'Sultan Sa Barongis',
  'Tapayan',
  'Upi',
  'Other / HQ',
]

export function extractMunicipality(username = '', area = '', fullName = '') {
  const u = String(username || '').trim().toLowerCase()
  const f = String(fullName || '').trim().toLowerCase()
  const a = String(area || '').trim()

  if (u.includes('southupi') || f.includes('south upi') || u.includes('sup-') || u.startsWith('sup') || a === '8') return 'South Upi'
  if (u.includes('upi') || f.includes('nuro upi') || f.includes('upi') || u.includes('nup-') || u.startsWith('nup') || a === '7') return 'Upi'
  if (u.includes('parang') || f.includes('parang') || u.includes('par-') || u.startsWith('par') || f.includes('sarmiento') || a === '2') return 'Parang'
  if (u.includes('shariffaguak') || f.includes('shariff aguak') || u.includes('sha-') || f.includes('maganoy') || a === '5') return 'Shariff Aguak'
  if (u.includes('shariffsaidona') || u.includes('saidona') || u.includes('saydona') || f.includes('saidona') || f.includes('saydona') || u.includes('ss-')) return 'Shariff Saydona'
  if (u.includes('datusaudi') || u.includes('dsa-') || u.startsWith('dsa') || f.includes('saudi')) return 'Datu Saudi Ampatuan'
  if (u.includes('ampatuan') || u.includes('amp-') || u.startsWith('amp') || f.includes('ampatuan') || a === '11') return 'Ampatuan'
  if (u.includes('buluan') || u.includes('bul-') || u.startsWith('bul') || f.includes('buluan') || a === '17') return 'Buluan'
  if (u.includes('das-') || u.startsWith('das') || f.includes('sangki') || a === '22') return 'Datu Abdullah Sangki (DAS)'
  if (u.includes('dbs-') || u.startsWith('dbs') || f.includes('blah') || a === '29') return 'Datu Blah Sinsuat (DBS)'
  if (u.includes('dos-') || u.startsWith('dos') || u.includes('dalican') || u.includes('awang') || f.includes('dalican') || f.includes('awang') || f.includes('odin sinsuat') || a === '14' || a === '4') return 'Datu Odin Sinsuat (DOS)'
  if (u.includes('datuhoffer') || u.includes('hoffer') || f.includes('hoffer') || a === '24') return 'Datu Hoffer'
  if (u.includes('montawal') || u.includes('dmontawal') || f.includes('montawal') || f.includes('pagagawan')) return 'Datu Montawal'
  if (u.includes('paglas') || f.includes('paglas')) return 'Datu Paglas'
  if (u.includes('datupiang') || u.includes('piang') || f.includes('piang') || f.includes('dulawan')) return 'Datu Piang'
  if (u.includes('mamasapano') || f.includes('mamasapano') || a === '21') return 'Mamasapano'
  if (u.includes('mangudadatu') || f.includes('mangudadatu')) return 'Mangudadatu'
  if (u.includes('pagalungan') || f.includes('pagalungan')) return 'Pagalungan'
  if (u.includes('rajahbuayan') || f.includes('buayan') || a === '3') return 'Rajah Buayan'
  if (u.includes('sultansabarongis') || u.includes('barongis') || f.includes('barongis')) return 'Sultan Sa Barongis'
  if (u.includes('gskp') || u.includes('pendatun') || f.includes('pendatun') || a === '27') return 'Gen. S.K. Pendatun'
  if (u.includes('nkabuntalan') || u.includes('kabuntalan') || a === '9') return 'Northern Kabuntalan'
  if (u.includes('tapayan') || f.includes('tapayan')) return 'Tapayan'

  return 'Other / HQ'
}

export function resolveMunicipalityFromBranch(branchStr = '') {
  if (!branchStr || typeof branchStr !== 'string') return null
  const b = branchStr.trim().toLowerCase()
  if (b.includes('hq') || b.includes('all') || b.includes('maguindanao hq') || b === 'system') {
    return ALL_MUNICIPALITIES
  }

  if (b.includes('south upi') || b.includes('southupi') || b.includes('sup-')) return 'South Upi'
  if (b.includes('upi') || b.includes('nuro') || b.includes('nup-')) return 'Upi'
  if (b.includes('parang') || b.includes('par-') || b.includes('sarmiento')) return 'Parang'
  if (b.includes('saudi')) return 'Datu Saudi Ampatuan'
  if (b.includes('ampatuan') || b.includes('amp-')) return 'Ampatuan'
  if (b.includes('buluan') || b.includes('bul-')) return 'Buluan'
  if (b.includes('das') || b.includes('sangki')) return 'Datu Abdullah Sangki (DAS)'
  if (b.includes('dbs') || b.includes('blah')) return 'Datu Blah Sinsuat (DBS)'
  if (b.includes('dos') || b.includes('odin') || b.includes('dalican') || b.includes('awang')) return 'Datu Odin Sinsuat (DOS)'
  if (b.includes('hoffer')) return 'Datu Hoffer'
  if (b.includes('montawal') || b.includes('pagagawan')) return 'Datu Montawal'
  if (b.includes('paglas')) return 'Datu Paglas'
  if (b.includes('piang') || b.includes('dulawan')) return 'Datu Piang'
  if (b.includes('mamasapano')) return 'Mamasapano'
  if (b.includes('mangudadatu')) return 'Mangudadatu'
  if (b.includes('pagalungan')) return 'Pagalungan'
  if (b.includes('buayan')) return 'Rajah Buayan'
  if (b.includes('barongis')) return 'Sultan Sa Barongis'
  if (b.includes('aguak') || b.includes('maganoy')) return 'Shariff Aguak'
  if (b.includes('saydona') || b.includes('saidona')) return 'Shariff Saydona'
  if (b.includes('pendatun') || b.includes('gskp')) return 'Gen. S.K. Pendatun'
  if (b.includes('kabuntalan')) return 'Northern Kabuntalan'
  if (b.includes('tapayan')) return 'Tapayan'

  return null
}

export function getRowMunicipality(row, muniLookup = null) {
  if (!row) return 'Other / HQ'

  if (muniLookup) {
    const spvrId = row.supervisor !== undefined && row.supervisor !== null ? String(row.supervisor).trim() : ''
    if (spvrId && muniLookup.byId?.has(spvrId)) {
      const muni = muniLookup.byId.get(spvrId)
      if (muni && muni !== 'Other / HQ') return muni
    }
    const spvrUser = String(row.supervisorUsername ?? '').trim().toLowerCase()
    if (spvrUser && muniLookup.byUsername?.has(spvrUser)) {
      const muni = muniLookup.byUsername.get(spvrUser)
      if (muni && muni !== 'Other / HQ') return muni
    }
  }

  if (row.location) {
    const muni = extractMunicipality(row.location, '', row.location)
    if (muni !== 'Other / HQ') return muni
  }

  if (row.address) {
    const muni = extractMunicipality(row.address, '', row.address)
    if (muni !== 'Other / HQ') return muni
  }

  if (row.outlet) {
    const muni = extractMunicipality(row.outlet, '', row.outlet)
    if (muni !== 'Other / HQ') return muni
  }

  if (row.username) {
    const muni = extractMunicipality(row.username, '', row.fullName || '')
    if (muni !== 'Other / HQ') return muni
  }

  if (muniLookup?.getMunicipality && row.supervisor) {
    const muni = muniLookup.getMunicipality(row.supervisor)
    if (muni) return muni
  }

  return 'Other / HQ'
}

export function buildSupervisorMunicipalityLookup(supervisorRows = []) {
  const byId = new Map()
  const byUsername = new Map()
  const byFullName = new Map()

  if (Array.isArray(supervisorRows)) {
    supervisorRows.forEach((s) => {
      if (!s) return
      const muni = extractMunicipality(s.username, s.area, s.fullName)
      if (s.id !== undefined && s.id !== null) byId.set(String(s.id), muni)
      if (s.username) byUsername.set(String(s.username).trim().toLowerCase(), muni)
      if (s.fullName) byFullName.set(String(s.fullName).trim().toUpperCase(), muni)
    })
  }

  return {
    getMunicipality: (supervisorIdOrName) => {
      if (!supervisorIdOrName) return 'Other / HQ'
      const str = String(supervisorIdOrName).trim()
      return (
        byId.get(str) ||
        byUsername.get(str.toLowerCase()) ||
        byFullName.get(str.toUpperCase()) ||
        extractMunicipality(str, '', str)
      )
    },
    byId,
    byUsername,
    byFullName,
  }
}
