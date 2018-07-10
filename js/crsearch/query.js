import {IndexType as IType} from './index-type'


class Query {
  constructor(log, text) {
    this._log = log.makeContext('Query')
    this._original_text = text
    this._frags = text.normalize('NFKC').split(/\s+/).filter(Boolean)

    this._filters = new Set


    const real_frags = []
    for (const fr of this._frags) {
      const kv = fr.split(/:/)
      if (kv[0] === 'type') {
        if (!kv[1]) continue

        const types = kv[1].split(/,/)
        for (const t of types) {
          let kind = null
          switch (t) {
            case 'header':     kind = IType.header; break
            case 'namespace':  kind = IType.namespace; break
            case 'class':      kind = IType.class; break
            case 'function':   kind = IType.function; break
            case 'mem_fun':    kind = IType.mem_fun; break
            case 'enum':       kind = IType.enum; break
            case 'variable':   kind = IType.variable; break
            case 'type-alias': kind = IType.type_alias; break
            case 'macro':      kind = IType.macro; break
            case 'article':    kind = IType.article; break
            case 'meta':       kind = IType.meta; break

            default:
              this._log.error('unhandled type in query', t)
              break
          }

          if (kind) {
            this._filters.add(kind)
          }
        }

      } else {
        real_frags.push(fr)
      }
    }

    this._frags = real_frags.reduce(
      (l, r) => { r[0] === '-' ? l.not.add(r.substring(1)) : l.and.add(r); return l },
      {and: new Set, not: new Set}
    )
    this._frags.not.delete('')

    // this._log.debug(`parsed query ${this._original_text}`, this._frags, this._filters)
  }

  match(idx) {
    return (this._filters.size === 0 || this._filters.has(idx.type)) &&
           Array.from(this._frags.and).every(s => idx.ambgMatch(s)) &&
           !Array.from(this._frags.not).some(s => idx.ambgMatch(s))
  }

  get original_text() {
    return this._original_text
  }
} // Query

export {Query}

