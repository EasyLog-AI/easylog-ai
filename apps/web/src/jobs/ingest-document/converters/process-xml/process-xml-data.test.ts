import { describe, expect, it } from 'vitest';

import processXmlData from './process-xml-data';

describe('processXmlData', () => {
  it('should process Acties XML correctly', () => {
    const xmlText = `<?xml version="1.0" encoding="UTF-8"?>
<dataroot xmlns:od="urn:schemas-microsoft-com:officedata" generated="2025-07-16T15:50:30">
<Acties>
<Id>1010</Id>
<Titel>De afdeling contractmanagement zal er op sturen dat uitvoering en overige afdelingen op de hoogte zijn van nieuwe opdrachten</Titel>
<Beschrijving>De afdeling contractmanagement zal er op sturen dat uitvoering en overige afdelingen op de hoogte zijn van nieuwe opdrachten en hiervan de voortgang bijhouden.</Beschrijving>
<Actiehouder>20</Actiehouder>
<Project>Concern</Project>
<Status_x0020_actie>Afgerond</Status_x0020_actie>
<Actietype>Corrigerende maatregel</Actietype>
<Volgt_x0020_uit_x0020_afwijking>035 - Mijlpalen</Volgt_x0020_uit_x0020_afwijking>
<Categorie>KM - Concern-systeemafwijkingen</Categorie>
<Inhoudstype>Item</Inhoudstype>
<Gewijzigd>2021-02-15T21:09:06</Gewijzigd>
<Gemaakt>2021-02-11T14:43:44</Gemaakt>
<Gemaakt_x0020_door>Bas Vogel</Gemaakt_x0020_door>
<Gewijzigd_x0020_door>Reinder Peterse</Gewijzigd_x0020_door>
<Pad_x0020_van_x0020_URL>sites/pm/Lists/Acties/1010_.000</Pad_x0020_van_x0020_URL>
<Pad>sites/pm/Lists/Acties</Pad>
<Itemtype>0</Itemtype>
<Gecodeerde_x0020_absolute_x0020_URL>https://dejongzuurmond.sharepoint.com/sites/pm/Lists/Acties/1010_.000</Gecodeerde_x0020_absolute_x0020_URL>
</Acties>
<Acties>
<Id>1011</Id>
<Titel>Door diversiteit en hoeveelheid werk(druk) bij projectmanagers</Titel>
<Beschrijving>Door diversiteit en hoeveelheid werk(druk) bij projectmanagers, hierdoor onvoldoende overzicht op project mijlpalen</Beschrijving>
<Actiehouder>25</Actiehouder>
<Project>Concern</Project>
<Status_x0020_actie>Afgerond</Status_x0020_actie>
<Actietype>Risico</Actietype>
<Volgt_x0020_uit_x0020_afwijking>035 - Mijlpalen</Volgt_x0020_uit_x0020_afwijking>
<Categorie>KM - Concern-systeemafwijkingen</Categorie>
<Inhoudstype>Item</Inhoudstype>
<Gewijzigd>2021-02-15T21:09:05</Gewijzigd>
<Gemaakt>2021-02-11T14:45:54</Gemaakt>
<Gemaakt_x0020_door>Bas Vogel</Gemaakt_x0020_door>
<Gewijzigd_x0020_door>Reinder Peterse</Gewijzigd_x0020_door>
<Pad_x0020_van_x0020_URL>sites/pm/Lists/Acties/1011_.000</Pad_x0020_van_x0020_URL>
<Pad>sites/pm/Lists/Acties</Pad>
<Itemtype>0</Itemtype>
<Gecodeerde_x0020_absolute_x0020_URL>https://dejongzuurmond.sharepoint.com/sites/pm/Lists/Acties/1011_.000</Gecodeerde_x0020_absolute_x0020_URL>
</Acties>
</dataroot>`;

    const result = processXmlData(xmlText);

    expect(result.name).toBe('Acties');
    expect(result.data).toHaveLength(2);
    expect(result.columns).toContain('Id');
    expect(result.columns).toContain('Titel');
    expect(result.columns).toContain('Beschrijving');
    expect(result.columns).toContain('Actiehouder');
    expect(result.columns).toContain('Project');
    expect(result.columns).toContain('Status actie');
    expect(result.columns).toContain('Actietype');
    expect(result.columns).toContain('Volgt uit afwijking');
    expect(result.columns).toContain('Categorie');
    expect(result.columns).toContain('Inhoudstype');
    expect(result.columns).toContain('Gewijzigd');
    expect(result.columns).toContain('Gemaakt');
    expect(result.columns).toContain('Gemaakt door');
    expect(result.columns).toContain('Gewijzigd door');
    expect(result.columns).toContain('Pad van URL');
    expect(result.columns).toContain('Pad');
    expect(result.columns).toContain('Itemtype');
    expect(result.columns).toContain('Gecodeerde absolute URL');

    // Check first record
    const firstRecord = result.data[0];
    expect(firstRecord.Id).toBe(1010);
    expect(firstRecord.Titel).toBe(
      'De afdeling contractmanagement zal er op sturen dat uitvoering en overige afdelingen op de hoogte zijn van nieuwe opdrachten'
    );
    expect(firstRecord.Beschrijving).toBe(
      'De afdeling contractmanagement zal er op sturen dat uitvoering en overige afdelingen op de hoogte zijn van nieuwe opdrachten en hiervan de voortgang bijhouden.'
    );
    expect(firstRecord.Actiehouder).toBe(20);
    expect(firstRecord.Project).toBe('Concern');
    expect(firstRecord['Status actie']).toBe('Afgerond');
    expect(firstRecord.Actietype).toBe('Corrigerende maatregel');
    expect(firstRecord['Volgt uit afwijking']).toBe('035 - Mijlpalen');
    expect(firstRecord.Categorie).toBe('KM - Concern-systeemafwijkingen');
    expect(firstRecord.Inhoudstype).toBe('Item');
    expect(firstRecord.Gewijzigd).toBe('2021-02-15T20:09:06.000Z');
    expect(firstRecord.Gemaakt).toBe('2021-02-11T13:43:44.000Z');
    expect(firstRecord['Gemaakt door']).toBe('Bas Vogel');
    expect(firstRecord['Gewijzigd door']).toBe('Reinder Peterse');
    expect(firstRecord['Pad van URL']).toBe('sites/pm/Lists/Acties/1010_.000');
    expect(firstRecord.Pad).toBe('sites/pm/Lists/Acties');
    expect(firstRecord.Itemtype).toBe(null);
    expect(firstRecord['Gecodeerde absolute URL']).toBe(
      'https://dejongzuurmond.sharepoint.com/sites/pm/Lists/Acties/1010_.000'
    );

    // Check second record
    const secondRecord = result.data[1];
    expect(secondRecord.Id).toBe(1011);
    expect(secondRecord.Titel).toBe(
      'Door diversiteit en hoeveelheid werk(druk) bij projectmanagers'
    );
    expect(secondRecord.Actiehouder).toBe(25);
    expect(secondRecord.Actietype).toBe('Risico');
  });

  it('should process Afwijkingen XML correctly', () => {
    const xmlText = `<?xml version="1.0" encoding="UTF-8"?>
<dataroot xmlns:od="urn:schemas-microsoft-com:officedata" generated="2025-07-16T15:52:43">
<Afwijkingen>
<Id>1001</Id>
<Intern_x0020_nummer>012</Intern_x0020_nummer>
<Datum_x0020_afwijking>2018-02-07T09:00:00</Datum_x0020_afwijking>
<Titel>NB 01 SCB-43</Titel>
<Type_x0020_afwijking>Concernafwijking (RWS)</Type_x0020_afwijking>
<Opgesteld_x002F_ingediend_x0020_door>Joey Everaard</Opgesteld_x002F_ingediend_x0020_door>
<Auditnummer>SCB-43 NB1</Auditnummer>
<Locatie>Beesd</Locatie>
<Moment_x0020_melding>Na werkzaamheden</Moment_x0020_melding>
<Melding_x0020_door>ON</Melding_x0020_door>
<Status_x0020_afwijking>Afgerond</Status_x0020_afwijking>
<Toepassing_x0020_proces>9.3 Directiebeoordeling</Toepassing_x0020_proces>
<Project>Concern (RWS)</Project>
<Opmerkingen>&lt;div&gt;test&lt;/div&gt;</Opmerkingen>
<Omvang>&lt;div&gt;test&lt;/div&gt;</Omvang>
<Akkoord_x0020_ON>...</Akkoord_x0020_ON>
<Akkoord_x0020_OG>...</Akkoord_x0020_OG>
<afw_versie>1</afw_versie>
<datum_akkoord_on>2021-12-10T00:00:00</datum_akkoord_on>
<vtw_nodig>Nee</vtw_nodig>
<naam_ondertekenaar>Willem van Eck</naam_ondertekenaar>
<datum_ondertekening>2021-12-10T00:00:00</datum_ondertekening>
<Proces_eigenaar>145</Proces_eigenaar>
<Inhoudstype>Item</Inhoudstype>
<Toepassing_>
<Value>Afwijking op eis</Value>
</Toepassing_>
<Gewijzigd>2022-12-05T11:51:50</Gewijzigd>
<Gemaakt>2021-12-10T11:00:03</Gemaakt>
<Gemaakt_x0020_door>Joey Everaard</Gemaakt_x0020_door>
<Gewijzigd_x0020_door>Bas Vogel</Gewijzigd_x0020_door>
<Pad_x0020_van_x0020_URL>sites/pm/Lists/Afwijkingen/1214_.000</Pad_x0020_van_x0020_URL>
<Pad>sites/pm/Lists/Afwijkingen</Pad>
<Itemtype>0</Itemtype>
<Gecodeerde_x0020_absolute_x0020_URL>https://dejongzuurmond.sharepoint.com/sites/pm/Lists/Afwijkingen/1214_.000</Gecodeerde_x0020_absolute_x0020_URL>
</Afwijkingen>
<Afwijkingen>
<Id>1002</Id>
<Intern_x0020_nummer>013</Intern_x0020_nummer>
<Datum_x0020_afwijking>2018-02-08T09:00:00</Datum_x0020_afwijking>
<Titel>NB 02 SCB-44</Titel>
<Type_x0020_afwijking>Projectafwijking</Type_x0020_afwijking>
<Opgesteld_x002F_ingediend_x0020_door>John Doe</Opgesteld_x002F_ingediend_x0020_door>
<Auditnummer>SCB-44 NB2</Auditnummer>
<Locatie>Amsterdam</Locatie>
<Moment_x0020_melding>Tijdens werkzaamheden</Moment_x0020_melding>
<Melding_x0020_door>OG</Melding_x0020_door>
<Status_x0020_afwijking>In behandeling</Status_x0020_afwijking>
<Toepassing_x0020_proces>5.3.2 Monitoring</Toepassing_x0020_proces>
<Project>RWS ONZ Droog (BVP)</Project>
<Opmerkingen>&lt;div&gt;test2&lt;/div&gt;</Opmerkingen>
<Omvang>&lt;div&gt;test2&lt;/div&gt;</Omvang>
<Akkoord_x0020_ON>...</Akkoord_x0020_ON>
<Akkoord_x0020_OG>...</Akkoord_x0020_OG>
<afw_versie>0.1</afw_versie>
<datum_akkoord_on>2021-12-11T00:00:00</datum_akkoord_on>
<vtw_nodig>Nee</vtw_nodig>
<naam_ondertekenaar>Jane Smith</naam_ondertekenaar>
<datum_ondertekening>2021-12-11T00:00:00</datum_ondertekening>
<Proces_eigenaar>13</Proces_eigenaar>
<Inhoudstype>Item</Inhoudstype>
<Toepassing_>
<Value>Afwijking op eis</Value>
</Toepassing_>
<Gewijzigd>2022-12-05T11:51:51</Gewijzigd>
<Gemaakt>2021-12-11T08:39:06</Gemaakt>
<Gemaakt_x0020_door>Piet Hak</Gemaakt_x0020_door>
<Gewijzigd_x0020_door>Bas Vogel</Gewijzigd_x0020_door>
<Pad_x0020_van_x0020_URL>sites/pm/Lists/Afwijkingen/1215_.000</Pad_x0020_van_x0020_URL>
<Pad>sites/pm/Lists/Afwijkingen</Pad>
<Itemtype>0</Itemtype>
<Gecodeerde_x0020_absolute_x0020_URL>https://dejongzuurmond.sharepoint.com/sites/pm/Lists/Afwijkingen/1215_.000</Gecodeerde_x0020_absolute_x0020_URL>
</Afwijkingen>
</dataroot>`;

    const result = processXmlData(xmlText);

    expect(result.name).toBe('Afwijkingen');
    expect(result.data).toHaveLength(2);
    expect(result.columns).toContain('Id');
    expect(result.columns).toContain('Intern nummer');
    expect(result.columns).toContain('Datum afwijking');
    expect(result.columns).toContain('Titel');
    expect(result.columns).toContain('Type afwijking');
    expect(result.columns).toContain('Opgesteld/ingediend door');
    expect(result.columns).toContain('Auditnummer');
    expect(result.columns).toContain('Locatie');
    expect(result.columns).toContain('Moment melding');
    expect(result.columns).toContain('Melding door');
    expect(result.columns).toContain('Status afwijking');
    expect(result.columns).toContain('Toepassing proces');
    expect(result.columns).toContain('Project');
    expect(result.columns).toContain('Opmerkingen');
    expect(result.columns).toContain('Omvang');
    expect(result.columns).toContain('Akkoord ON');
    expect(result.columns).toContain('Akkoord OG');
    expect(result.columns).toContain('afw_versie');
    expect(result.columns).toContain('datum_akkoord_on');
    expect(result.columns).toContain('vtw_nodig');
    expect(result.columns).toContain('naam_ondertekenaar');
    expect(result.columns).toContain('datum_ondertekening');
    expect(result.columns).toContain('Proces_eigenaar');
    expect(result.columns).toContain('Inhoudstype');
    expect(result.columns).toContain('Gewijzigd');
    expect(result.columns).toContain('Gemaakt');
    expect(result.columns).toContain('Gemaakt door');
    expect(result.columns).toContain('Gewijzigd door');
    expect(result.columns).toContain('Pad van URL');
    expect(result.columns).toContain('Pad');
    expect(result.columns).toContain('Itemtype');
    expect(result.columns).toContain('Gecodeerde absolute URL');

    // Check first record
    const firstRecord = result.data[0];
    expect(firstRecord.Id).toBe(1001);
    expect(firstRecord['Intern nummer']).toBe(12);
    expect(firstRecord['Datum afwijking']).toBe('2018-02-07T08:00:00.000Z');
    expect(firstRecord.Titel).toBe('NB 01 SCB-43');
    expect(firstRecord['Type afwijking']).toBe('Concernafwijking (RWS)');
    expect(firstRecord['Opgesteld/ingediend door']).toBe('Joey Everaard');
    expect(firstRecord.Auditnummer).toBe('SCB-43 NB1');
    expect(firstRecord.Locatie).toBe('Beesd');
    expect(firstRecord['Moment melding']).toBe('Na werkzaamheden');
    expect(firstRecord['Melding door']).toBe('ON');
    expect(firstRecord['Status afwijking']).toBe('Afgerond');
    expect(firstRecord['Toepassing proces']).toBe('9.3 Directiebeoordeling');
    expect(firstRecord.Project).toBe('Concern (RWS)');
    expect(firstRecord.Opmerkingen).toBe('<div>test</div>');
    expect(firstRecord.Omvang).toBe('<div>test</div>');
    expect(firstRecord['Akkoord ON']).toBe('...');
    expect(firstRecord['Akkoord OG']).toBe('...');
    expect(firstRecord.afw_versie).toBe(1);
    expect(firstRecord.datum_akkoord_on).toBe('2021-12-09T23:00:00.000Z');
    expect(firstRecord.vtw_nodig).toBe('Nee');
    expect(firstRecord.naam_ondertekenaar).toBe('Willem van Eck');
    expect(firstRecord.datum_ondertekening).toBe('2021-12-09T23:00:00.000Z');
    expect(firstRecord.Proces_eigenaar).toBe(145);
    expect(firstRecord.Inhoudstype).toBe('Item');
    expect(firstRecord.Gewijzigd).toBe('2022-12-05T10:51:50.000Z');
    expect(firstRecord.Gemaakt).toBe('2021-12-10T10:00:03.000Z');
    expect(firstRecord['Gemaakt door']).toBe('Joey Everaard');
    expect(firstRecord['Gewijzigd door']).toBe('Bas Vogel');
    expect(firstRecord['Pad van URL']).toBe(
      'sites/pm/Lists/Afwijkingen/1214_.000'
    );
    expect(firstRecord.Pad).toBe('sites/pm/Lists/Afwijkingen');
    expect(firstRecord.Itemtype).toBe(null);
    expect(firstRecord['Gecodeerde absolute URL']).toBe(
      'https://dejongzuurmond.sharepoint.com/sites/pm/Lists/Afwijkingen/1214_.000'
    );

    // Check second record
    const secondRecord = result.data[1];
    expect(secondRecord.Id).toBe(1002);
    expect(secondRecord['Intern nummer']).toBe(13);
    expect(secondRecord.Titel).toBe('NB 02 SCB-44');
    expect(secondRecord['Type afwijking']).toBe('Projectafwijking');
    expect(secondRecord['Status afwijking']).toBe('In behandeling');
  });

  it('should throw error for XML without repeating elements', () => {
    const xmlText = `<?xml version="1.0" encoding="UTF-8"?>
<dataroot>
<SingleElement>
<Id>1</Id>
<Name>Test</Name>
</SingleElement>
</dataroot>`;

    expect(() => processXmlData(xmlText)).toThrow(
      'No repeating elements found in XML'
    );
  });
});
