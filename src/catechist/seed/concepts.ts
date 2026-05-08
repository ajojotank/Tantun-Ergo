export interface ConceptSeed {
  name: string
  slug: string
  definition: string
  category:
    | 'trinity-god' | 'christology' | 'soteriology' | 'sacraments'
    | 'moral' | 'ecclesiology' | 'eschatology' | 'mariology' | 'spirituality' | 'other'
  parentSlug?: string
  synonyms?: string[]
}

export const CONCEPT_SEEDS: ConceptSeed[] = [
  // Trinity / God
  { name: 'Trinity', slug: 'trinity', category: 'trinity-god',
    definition: 'The doctrine that God is one Being in three co-equal, co-eternal divine Persons: Father, Son, and Holy Spirit.',
    synonyms: ['Triune God', 'Holy Trinity', 'three Persons one God'] },
  { name: 'Father (Person)', slug: 'father-person', category: 'trinity-god', parentSlug: 'trinity',
    definition: 'The first divine Person of the Trinity, source of the Son by eternal generation and of the Holy Spirit by spiration.' },
  { name: 'Son (Person)', slug: 'son-person', category: 'trinity-god', parentSlug: 'trinity',
    definition: 'The second divine Person, eternally begotten of the Father, incarnate in Jesus Christ.',
    synonyms: ['Logos', 'Word'] },
  { name: 'Holy Spirit (Person)', slug: 'holy-spirit-person', category: 'trinity-god', parentSlug: 'trinity',
    definition: 'The third divine Person, proceeding from the Father and the Son.',
    synonyms: ['Paraclete', 'Spirit of God'] },
  { name: 'Divine Nature', slug: 'divine-nature', category: 'trinity-god',
    definition: 'The single, indivisible essence of God, shared fully and equally by the three divine Persons.' },
  { name: 'Hypostatic Union', slug: 'hypostatic-union', category: 'christology',
    definition: 'The union of the divine and human natures in the one Person of Jesus Christ, without confusion or separation.' },

  // Christology
  { name: 'Incarnation', slug: 'incarnation', category: 'christology',
    definition: 'The eternal Son of God taking on human nature and being born of the Virgin Mary.' },
  { name: 'Redemption', slug: 'redemption', category: 'christology',
    definition: "Christ's saving work freeing humanity from sin and death through his Passion, Death, and Resurrection." },
  { name: 'Resurrection', slug: 'resurrection', category: 'christology',
    definition: "Christ's rising bodily from the dead on the third day, the foundation of Christian faith." },
  { name: 'Real Presence', slug: 'real-presence', category: 'sacraments',
    definition: 'The doctrine that in the Eucharist Christ is truly, really, and substantially present under the appearances of bread and wine.',
    synonyms: ['transubstantiation', 'eucharistic presence'] },
  { name: 'Two Natures of Christ', slug: 'two-natures', category: 'christology',
    definition: 'Christ possesses both a complete divine nature and a complete human nature, united in one Person (Chalcedonian definition).' },

  // Soteriology / Grace
  { name: 'Sanctifying Grace', slug: 'sanctifying-grace', category: 'soteriology',
    definition: "The supernatural gift of God's life dwelling in the soul, making us partakers of the divine nature.",
    synonyms: ['habitual grace'] },
  { name: 'Actual Grace', slug: 'actual-grace', category: 'soteriology',
    definition: 'Transient supernatural help from God enabling specific acts of will or intellect ordered to salvation.' },
  { name: 'Prevenient Grace', slug: 'prevenient-grace', category: 'soteriology',
    definition: 'Grace that precedes and prepares the will to consent to faith and conversion.' },
  { name: 'Justification', slug: 'justification', category: 'soteriology',
    definition: 'The act of God whereby he makes the sinner truly righteous through the gift of grace, washing away sin.' },
  { name: 'Faith', slug: 'faith', category: 'soteriology',
    definition: 'The theological virtue by which we believe in God and all that he has revealed.' },
  { name: 'Hope', slug: 'hope', category: 'soteriology',
    definition: "The theological virtue by which we desire eternal life as our happiness, trusting in Christ's promises." },
  { name: 'Charity', slug: 'charity', category: 'soteriology',
    definition: 'The theological virtue by which we love God above all things and our neighbour as ourselves for the love of God.',
    synonyms: ['love', 'agape'] },

  // Sacraments
  { name: 'Sacrament', slug: 'sacrament', category: 'sacraments',
    definition: 'An efficacious sign of grace, instituted by Christ and entrusted to the Church, by which divine life is dispensed.' },
  { name: 'Baptism', slug: 'baptism', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament of initiation that washes away original sin, confers sanctifying grace, and incorporates the recipient into the Body of Christ.' },
  { name: 'Confirmation', slug: 'confirmation', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament that completes baptismal grace by a special outpouring of the Holy Spirit.' },
  { name: 'Eucharist', slug: 'eucharist', category: 'sacraments', parentSlug: 'sacrament',
    definition: "The sacrament of Christ's Body and Blood, the source and summit of the Christian life.",
    synonyms: ['Holy Communion', 'Blessed Sacrament', 'Mass'] },
  { name: 'Confession', slug: 'confession', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament by which the faithful obtain absolution from sins committed after Baptism through priestly ministry.',
    synonyms: ['Reconciliation', 'Penance'] },
  { name: 'Anointing of the Sick', slug: 'anointing', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament by which the Church entrusts the dangerously ill to the suffering and glorified Lord, and confers grace for healing.' },
  { name: 'Holy Orders', slug: 'holy-orders', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament by which the mission entrusted by Christ to his apostles continues in the Church through bishops, priests, and deacons.' },
  { name: 'Matrimony', slug: 'matrimony', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament by which a baptized man and woman form a permanent partnership of life and love, ordered to the good of the spouses and the procreation of children.' },

  // Moral
  { name: 'Natural Law', slug: 'natural-law', category: 'moral',
    definition: 'The moral law inscribed by God in human nature, knowable by reason, expressing what is good and just.' },
  { name: 'Conscience', slug: 'conscience', category: 'moral',
    definition: 'The judgment of reason by which the human person recognizes the moral quality of a concrete act.' },
  { name: 'Mortal Sin', slug: 'mortal-sin', category: 'moral',
    definition: "A grave violation of God's law committed with full knowledge and deliberate consent, severing the soul from sanctifying grace." },
  { name: 'Venial Sin', slug: 'venial-sin', category: 'moral',
    definition: "A less serious offense against God's law, wounding charity but not destroying it." },
  { name: 'Cardinal Virtues', slug: 'cardinal-virtues', category: 'moral',
    definition: 'The four moral virtues — prudence, justice, fortitude, temperance — on which the moral life pivots.' },
  { name: 'Theological Virtues', slug: 'theological-virtues', category: 'moral',
    definition: 'Faith, hope, and charity — virtues infused by God that have God himself for their object.' },
  { name: 'Beatitudes', slug: 'beatitudes', category: 'moral',
    definition: 'The promises of blessedness given by Christ in the Sermon on the Mount, depicting the face of the Christian disciple.' },

  // Ecclesiology
  { name: 'Church (Mystical Body)', slug: 'church', category: 'ecclesiology',
    definition: 'The Mystical Body of Christ, the People of God, the Sacrament of salvation; one, holy, catholic, and apostolic.' },
  { name: 'Magisterium', slug: 'magisterium', category: 'ecclesiology',
    definition: 'The teaching authority of the Church, exercised by the Pope and the bishops in communion with him.' },
  { name: 'Apostolic Succession', slug: 'apostolic-succession', category: 'ecclesiology',
    definition: "The unbroken transmission of the apostles' mission and authority through the laying on of hands by validly ordained bishops." },
  { name: 'Papal Authority', slug: 'papal-authority', category: 'ecclesiology',
    definition: 'The supreme, full, immediate, and universal power of the Roman Pontiff over the whole Church.' },
  { name: 'Communion of Saints', slug: 'communion-of-saints', category: 'ecclesiology',
    definition: 'The spiritual union of the faithful on earth, in purgatory, and in heaven in Christ.' },

  // Eschatology
  { name: 'Heaven', slug: 'heaven', category: 'eschatology',
    definition: "The final state of communion with the Blessed Trinity for those who die in God's grace and friendship.",
    synonyms: ['Beatific Vision'] },
  { name: 'Hell', slug: 'hell', category: 'eschatology',
    definition: 'The state of definitive self-exclusion from communion with God and the blessed, chosen by those who die in mortal sin without repentance.' },
  { name: 'Purgatory', slug: 'purgatory', category: 'eschatology',
    definition: "The state of those who die in God's grace but still need purification to enter the joy of heaven." },
  { name: 'Last Judgment', slug: 'last-judgment', category: 'eschatology',
    definition: "Christ's final judgment at the end of time over the living and the dead." },
  { name: 'Particular Judgment', slug: 'particular-judgment', category: 'eschatology',
    definition: 'The judgment each person undergoes at the moment of death.' },

  // Mariology
  { name: 'Mary (Theotokos)', slug: 'mary-theotokos', category: 'mariology',
    definition: 'The Blessed Virgin Mary, Mother of God; her divine maternity is the foundation of all Marian doctrine.',
    synonyms: ['Mother of God', 'Blessed Virgin Mary'] },
  { name: 'Immaculate Conception', slug: 'immaculate-conception', category: 'mariology', parentSlug: 'mary-theotokos',
    definition: 'The doctrine that Mary, from the first instant of her conception, was preserved free from all stain of original sin.' },
  { name: 'Assumption', slug: 'assumption', category: 'mariology', parentSlug: 'mary-theotokos',
    definition: 'The doctrine that Mary, at the end of her earthly life, was assumed body and soul into heavenly glory.' },
  { name: 'Perpetual Virginity', slug: 'perpetual-virginity', category: 'mariology', parentSlug: 'mary-theotokos',
    definition: 'The doctrine that Mary remained a virgin before, during, and after the birth of Christ.' },

  // Spirituality
  { name: 'Prayer', slug: 'prayer', category: 'spirituality',
    definition: "The raising of one's mind and heart to God, expressing adoration, contrition, thanksgiving, and supplication." },
  { name: 'Liturgy', slug: 'liturgy', category: 'spirituality',
    definition: 'The public worship of the Church, especially the Mass and the Liturgy of the Hours.' },
  { name: 'Lectio Divina', slug: 'lectio-divina', category: 'spirituality',
    definition: 'Sacred reading: a contemplative engagement with Scripture in four movements (lectio, meditatio, oratio, contemplatio).' },
  { name: 'Devotion to the Saints', slug: 'devotion-saints', category: 'spirituality',
    definition: 'The honor and veneration given to the saints, who are intercessors before God and models of holiness.' },
]
