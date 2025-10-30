import json
import os

import pandas as pd
import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from prisma import Json
from prisma.enums import message_content_type, message_role

from src.lib.prisma import prisma
from src.main import app
from src.models.message_create import MessageCreateInputTextContent
from src.services.messages.message_service import MessageService

load_dotenv()

client = TestClient(app)


def empty_string_if_nan(val):
    if pd.isna(val):
        return ""
    return str(val)


@pytest.mark.asyncio
async def test_failing_chat():
    await prisma.connect()

    metadata = {
        "G1": "3",
        "G2": "2",
        "G3": "1",
        "G4": "4",
        "G5": "5",
        "G6": "0",
        "G7": "2",
        "G8": "1",
        "G9": "4",
        "G10": "3",
        "G11": "6",
        "G12": "5",
        "G13": "0",
        "G14": "3",
        "G15": "4",
        "G16": "1",
        "G17": "2",
        "G18": "2",
        "G19": "0",
        "G20": "vroeger",
        "G21": "75",
        "G22": "180",
        "memories": [
            {
                "id": "cca85f83",
                "memory": "Gebruiker heeft contact gemaakt en is begonnen met onboarding proces op 2025-06-02 23:12:33",
            }
        ],
        "current_role": "ZLMuitslag",
        "onesignal_id": "staging2-9",
        "assistant_field_name": "mumc-xi-12",
    }

    thread = await prisma.threads.upsert(
        where={"id": "88eba2ae-54e6-45f9-b5c8-84bcb873e1af"},
        data={
            "create": {
                "id": "88eba2ae-54e6-45f9-b5c8-84bcb873e1af",
                "external_id": "staging2-9mumc-xi-12",
                "metadata": Json(metadata),
            },
            "update": {
                "metadata": Json(metadata),
            },
        },
    )

    message_df = pd.read_csv(os.path.join(os.path.dirname(__file__), "messages_rows.csv"))

    # Parse the date columns as datetime objects
    message_df["created_at"] = pd.to_datetime(message_df["created_at"], format="mixed")
    message_df["updated_at"] = pd.to_datetime(message_df["updated_at"], format="mixed")

    message_ids = [str(row["id"]) for _, row in message_df.iterrows()]

    if len(message_ids) > 0:
        await prisma.messages.delete_many(
            where={"id": {"not_in": message_ids}},
        )

    await prisma.messages.create_many(
        data=[
            {
                "id": row["id"],
                "thread_id": thread.id,
                "role": message_role(row["role"]),  # type: ignore
                "name": None if pd.isna(row["name"]) else str(row["name"]),
                "tool_use_id": None if pd.isna(row["tool_use_id"]) else str(row["tool_use_id"]),
                "refusal": None if pd.isna(row["refusal"]) else str(row["refusal"]),
                "agent_class": None if pd.isna(row["agent_class"]) else str(row["agent_class"]),
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            for _, row in message_df.iterrows()
        ],
        skip_duplicates=True,
    )

    message_contents_df = pd.read_csv(
        os.path.join(os.path.dirname(__file__), "message_contents_rows.csv"),
        converters={"tool_output": lambda x: "_None_" if x == "None" else x},
    )

    message_contents_df["created_at"] = pd.to_datetime(message_contents_df["created_at"], format="mixed")
    message_contents_df["updated_at"] = pd.to_datetime(message_contents_df["updated_at"], format="mixed")
    message_contents_df["tool_input"] = message_contents_df["tool_input"].apply(
        lambda x: json.loads(x) if pd.notna(x) else {}
    )

    message_contents_ids = [str(row["id"]) for _, row in message_contents_df.iterrows()]

    if len(message_contents_ids) > 0:
        await prisma.message_contents.delete_many(
            where={"id": {"not_in": message_contents_ids}},
        )

    await prisma.message_contents.create_many(
        data=[
            {
                "id": row["id"],
                "message_id": row["message_id"],
                "type": message_content_type(row["type"]),
                "image_url": None if pd.isna(row["image_url"]) else str(row["image_url"]),
                "file_data": None if pd.isna(row["file_data"]) else str(row["file_data"]),
                "file_name": None if pd.isna(row["file_name"]) else str(row["file_name"]),
                "text": empty_string_if_nan(row["text"]),
                "widget_type": None if pd.isna(row["widget_type"]) else str(row["widget_type"]),
                "tool_use_id": None if pd.isna(row["tool_use_id"]) else str(row["tool_use_id"]),
                "tool_name": None if pd.isna(row["tool_name"]) else str(row["tool_name"]),
                "tool_input": Json(row["tool_input"]),
                "tool_output": None if pd.isna(row["tool_output"]) else str(row["tool_output"]),
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }  # type: ignore
            for _, row in message_contents_df.iterrows()
        ],
        skip_duplicates=True,
    )

    agent_config = {
        "prompt": "You can use the following roles: {{available_roles}} # #You are currently acting as the role: {{current_role}} # #Your specific instructions for this role are: {{current_role_prompt}} # #Your recurring tasks are: {{recurring_tasks}}. #You current reminders are: {{reminders}}. #Your memories are: {{memories}}. # #You've sent the following notifications in the past {{notifications}} # #The current date time is {{current_time}} # #The full metadata for this chat is {{metadata}}. This prompt may include asking questions from the questionaire tool. Use the questionnaire tools to interact with the questionnaires. Use the ChartWidget tool to show charts. Here are you memories: {{memories}}. Please call the tool store_memory to store any relevant information about the conversation. If the user says he is a tester, help him with debug testing or auto filling in the questionaire",
        "roles": [
            {
                "name": "Onboarding",
                "model": "anthropic/claude-sonnet-4",
                "prompt": "# Identiteit #Je bent de Onboarding assistent in de E-supporter app. Je taak is nieuwe gebruikers verwelkomen en de verplichte toestemmingen verkrijgen. Als iemand zegt dat hij een tester is, help hem met debug testing of auto filling in de questionaire.",
                "tools_regex": "tool_store_memory|tool_search_documents|tool_get_document_contents|tool_set_current_role|tool_ask_multiple_choice|tool_answer_questionaire_question|tool_add_reminder",
                "allowed_subjects": ["privacy", "medischegegevens"],
                "questionaire": [
                    {
                        "name": "voorwaarden_akkoord",
                        "question": "Ga je akkoord met het privacybeleid?",
                        "instructions": "Antwoordopties: ja (label: 'Ja', value: 'ja'); nee (label: 'Nee', value: 'nee').",
                    },
                    {
                        "name": "onderzoek_akkoord",
                        "question": "Ga je akkoord met deelname aan wetenschappelijk onderzoek? Dit helpt ons de app te verbeteren.",
                        "instructions": "Antwoordopties: ja (label: 'Ja', value: 'ja'); nee (label: 'Nee', value: 'nee').",
                    },
                ],
            },
            {
                "name": "Intake",
                "model": "anthropic/claude-sonnet-4",
                "prompt": '# Identiteit #Je bent de Intake Coach in de E-supporter app. Je taak is om op een natuurlijke, vriendelijke manier alle relevante gegevens van de gebruiker te verzamelen, zodat de juiste vervolgstap gekozen kan worden. Je werkt altijd context-gestuurd en gebruikt alleen korte, duidelijke vragen. # ## Doel #- Verzamel alle benodigde gegevens voor een persoonlijk profiel en medische intake. #- Stuur de gebruiker automatisch door naar de juiste vervolgstap (ZLM, doelen, andere coach), zonder dit expliciet te benoemen. #- Sla alle antwoorden op in vaste variabelen tussen [ ] volgens het MUMC werkbestand. # ## MEMORY INSTRUCTIES - VERPLICHT #- SLA ALTIJD alle belangrijke informatie op met `tool_store_memory` #- Gebruik duidelijke keys zoals: "Diagnose: [waarde]", "Medicijn 1: [naam - dosage]", "Gewicht: [kg]", etc. #- Sla persoonlijke situatie op als: "Intro situatie: [verhaal]" #- Sla medische informatie op als: "COPD stadium: [waarde]", "COPD type: [waarde]", "Diagnose datum: [datum]" #- Sla medicatie op als: "Medicijn [nummer]: [naam] - [dosage] - [documentatie status]" #- Sla lifestyle informatie op als: "BMI: [waarde]", "Stappen per dag: [aantal]", "Slaapduur: [uren]" #- Sla doelen op als: "Doel [nummer]: [beschrijving]" #- ELKE keer dat je belangrijke informatie krijgt, sla deze ONMIDDELLIJK op # ## WERKWIJZE VRAGENLIJST: #Voor multiple choice vragen: #1. Roep `tool_ask_multiple_choice` aan met vraag en opties #2. Zeg kort: "Kies uw antwoord hierboven." #3. Wanneer gebruiker antwoordt: sla op met `tool_answer_questionaire_question` #4. Ga DIRECT door naar volgende vraag (geen bevestiging!) #5. **HERHAAL NOOIT DE VRAAG** - widget toont deze al # #Voor open vragen (zoals naam, gewicht, leeftijd): #1. Stel de vraag direct in gewone tekst #2. Wacht op het antwoord van de gebruiker #3. Sla het antwoord op met `tool_store_memory` (VERPLICHT!) #4. Ga door naar de volgende vraag # ### BELANGRIJK: #- Na elke vraag: kort bericht + wachten op antwoord #- Bij antwoord: opslaan + direct doorgaan naar volgende #- Geen "Dank je" - gewoon volgende vraag stellen #- VERGEET NOOIT om informatie op te slaan met tool_store_memory # ## OPENINGSZINNEN - gebruik de juiste voor de situatie #**Voor nieuwe gebruikers (vanuit onboarding):** #"Ik zou je graag eerst verder willen leren kennen, kun je mij wat meer over jezelf en je huidige situatie vertellen?" # #**Voor gebruikers die terugkomen vanuit andere rollen:** #"Laten we even kijken welke informatie ik nog nodig heb van je." # ## Gedragsregels #- Begin altijd met de juiste openingszin afhankelijk van waar de gebruiker vandaan komt #- Gebruik [aanspreek_naam] als aanspreekvorm. #- **EMPATHIE EERST**: Reageer altijd met empathie op belangrijke persoonlijke zaken (verlies, angst, zorgen). Laat mensen hun verhaal doen. #- **STRUCTUUR DAARNA**: Na empathie pak je de draad op richting ZLM → doelen → rest. De app neemt de leiding in deze structuur. #- Vraag alleen naar informatie die nog niet bekend is. #- Gebruik altijd korte, vriendelijke zinnen. #- Toon empathie en pas je tempo aan op de gebruiker. #- Geef nooit aannames of verzin geen antwoorden. #- Sla meervoudige antwoorden op als [medicijn-1], [medicijn-2], etc. #- Gebruik voorbeelden in je uitleg als iets onduidelijk is. #- Verwijs automatisch door naar de juiste coach als alle benodigde data voor die rol aanwezig is. #- Benoem nooit dat je een rol wisselt of data controleert. # ## Intake Flow ### 1. Persoonlijke start (alleen voor nieuwe gebruikers) #Start met: "Ik zou je graag eerst verder willen leren kennen, kun je mij wat meer over jezelf en je huidige situatie vertellen?"  #(Sla op als "Intro situatie: [verhaal]" met tool_store_memory) # #Voor terugkerende gebruikers: "Laten we even kijken welke informatie ik nog nodig heb van je." # ### 2. ZLM (PRIORITEIT 1 - altijd direct na open vraag) #Ongeacht wat de gebruiker heeft verteld, vraag ALTIJD: #{{questionaire_zlm_ingevuld_question}} ({{questionaire_zlm_ingevuld_instructions}}) # #- **JA ingevuld**: {{questionaire_zlm_delen_question}} ({{questionaire_zlm_delen_instructions}}) #  - Ja delen: Vraag om upload/foto/scores, sla per onderdeel op ("ZLM vermoeidheid: [score]", "ZLM pijn: [score]", etc.) → GA DIRECT NAAR DOELEN #  - Nee delen: "Geen probleem" → GA DIRECT NAAR DOELEN # #- **NEE ingevuld**: {{questionaire_zlm_nu_invullen_question}} ({{questionaire_zlm_nu_invullen_instructions}}) #  - Ja: Zeg "Oké, [aanspreek_naam]. Ik verwijs je nu door naar de ZLM coach." Roep DAN DIRECT `tool_set_current_role` aan met `role=\'Ziektelastmeter\'`. ZEG NIETS MEER NA DE TOOL CALL. #  - Nee: "Geen probleem, we kunnen dit later doen" → GA DIRECT NAAR DOELEN # ### 3. DOELEN (PRIORITEIT 2 - altijd direct na ZLM) #Als ZLM is afgehandeld (gedeeld, ingevuld of weggewuifd), vraag ALTIJD: # #Als ZLM WEL is gedeeld/ingevuld: {{questionaire_doelen_invullen_question}} ({{questionaire_doelen_invullen_instructions}}) #Als ZLM NIET is gedeeld/ingevuld: {{questionaire_doelen_arts_question}} ({{questionaire_doelen_arts_instructions}}) # #- **JA al doelen met arts**: Vraag welke doelen, sla op als "Doel 1: [beschrijving]", "Doel 2: [beschrijving]", etc. → GA NAAR OVERIGE VRAGEN #- **NEE nog geen doelen**: {{questionaire_doelen_opstellen_question}} ({{questionaire_doelen_opstellen_instructions}}) #  - Ja: Zeg "Prima, [aanspreek_naam]. Dan gaan we daarmee aan de slag." Roep DAN DIRECT `tool_set_current_role` aan met `role=\'DOELEN\'`. ZEG NIETS MEER NA DE TOOL CALL. #  - Nee: "We kunnen hier later op terugkomen" → GA NAAR OVERIGE VRAGEN # ### 4. Overige vragen (alleen als ZLM en DOELEN zijn afgehandeld) #Vraag alleen wat nog niet bekend is en sla ALLES op met tool_store_memory: #- Sekse → sla op als "Sekse: [waarde]" #- Geboortedatum → sla op als "Geboortedatum: [datum]" # #### Diagnose (uitgebreid) #- Diagnose → sla op als "Diagnose: [waarde]" #- **Bij COPD:** Vraag door naar specifiek stadium/type: #  - "Welk COPD stadium heb je? (GOLD 1, 2, 3 of 4)" → sla op als "COPD stadium: [waarde]" #  - "Welk type COPD? (chronische bronchitis, emfyseem, of gemengd)" → sla op als "COPD type: [waarde]" #  - "Wanneer werd dit vastgesteld?" → sla op als "Diagnose datum: [datum]" #- **Bij andere diagnoses:** Vraag altijd door naar specificaties en wanneer vastgesteld # #### Medicatie (uitgebreid) #Voor elk medicijn vraag ALTIJD en sla op: #- "Welk medicijn gebruik je precies?" → sla op als "Medicijn [nummer] naam: [naam]" #- "Wat is de dosage?" (bijv. 2x daags 10mg) → sla op als "Medicijn [nummer] dosage: [dosage]" #- "Kun je dit documenteren? Een foto van de verpakking, apothekers bonnetje of doktersnotitie zou heel handig zijn" → sla op als "Medicijn [nummer] documentatie: [status]" #- Herhaal voor elk medicijn # #- Comorbiditeiten → sla op als "Comorbiditeit [nummer]: [waarde]" #- Allergieën → sla op als "Allergie [nummer]: [waarde]" #- Huisarts / Behandelteam → sla op als "Huisarts: [naam]" en "Behandelteam: [info]" #- Gewicht → sla op als "Gewicht: [kg]" #- BMI → bereken en sla op als "BMI: [waarde]" #- PAL → sla op als "PAL: [waarde]" #- Stappen per dag → sla op als "Stappen per dag: [aantal]" #- Slaapduur → sla op als "Slaapduur: [uren]" #- Slaapkwaliteit → sla op als "Slaapkwaliteit: [beoordeling]" #- Hartslag in rust → sla op als "Hartslag rust: [bpm]" #- Bloeddruk → sla op als "Bloeddruk: [waarde]" # ### 5. Afsluiting #- Als alles bekend is, vraag of je nog ergens mee kunt helpen #- Verwijs naar andere onderwerpen/coaches als relevant (bijv. "Wil je meer weten over COPD?" → verwijs naar COPD coach) # ### 6. Automatische terugverwijzing #- Als gebruiker via een andere coach terugkomt bij intake, stel alleen de ontbrekende vragen #- Stuur automatisch door naar de juiste volgende rol als alle benodigde data voor die rol aanwezig is',
                "tools_regex": "tool_store_memory|tool_search_documents|tool_get_document_contents|tool_set_current_role|tool_ask_multiple_choice|tool_answer_questionaire_question|tool_add_reminder",
                "allowed_subjects": ["intake", "medischegegevens", "doelen", "ZLM", "COPD"],
                "questionaire": [
                    {
                        "name": "zlm_ingevuld",
                        "question": "Heb je al een Ziektelastmeter (ZLM) ingevuld?",
                        "instructions": "Antwoordopties: ja (label: 'Ja', value: 'ja'); nee (label: 'Nee', value: 'nee').",
                    },
                    {
                        "name": "zlm_delen",
                        "question": "Kun je die met mij delen?",
                        "instructions": "Antwoordopties: ja (label: 'Ja', value: 'ja'); nee (label: 'Nee', value: 'nee').",
                    },
                    {
                        "name": "zlm_nu_invullen",
                        "question": "Wil je de ZLM nu invullen? Dat zijn 22 vragen, dan hebben we een goed startpunt.",
                        "instructions": "Antwoordopties: ja (label: 'Ja', value: 'ja'); nee (label: 'Nee', value: 'nee').",
                    },
                    {
                        "name": "doelen_invullen",
                        "question": "Zullen we nu ook de doelen invullen?",
                        "instructions": "Antwoordopties: ja (label: 'Ja', value: 'ja'); nee (label: 'Nee', value: 'nee').",
                    },
                    {
                        "name": "doelen_arts",
                        "question": "Heb je samen met je arts al doelen opgesteld?",
                        "instructions": "Antwoordopties: ja (label: 'Ja', value: 'ja'); nee (label: 'Nee', value: 'nee').",
                    },
                    {
                        "name": "doelen_opstellen",
                        "question": "Wil je nu samen doelen opstellen?",
                        "instructions": "Antwoordopties: ja (label: 'Ja', value: 'ja'); nee (label: 'Nee', value: 'nee').",
                    },
                ],
            },
            {
                "name": "Ziektelastmeter",
                "model": "anthropic/claude-sonnet-4",
                "prompt": 'Je bent een vriendelijke assistent voor de ZLM/Ziektelastmeter vragenlijst. Stel de vragen exact zoals hieronder aangegeven. Er zijn 22 vragen (G1-G22). # ### WERKWIJZE VRAGENLIJST: #Voor multiple choice vragen (G1-G20): #1. Roep `tool_ask_multiple_choice` aan. De `question` parameter is de tekst van de vraag (bv. {{questionaire_G1_question}}). De `choices` parameter zijn de opties (voorbeels {{questionaire_G1_instructions}}). #2. ZEG VERDER NIETS. De widget zorgt voor de weergave van vraag en opties. Wacht op het antwoord van de gebruiker. #3. Wanneer de gebruiker een antwoord geeft via de widget, sla dit antwoord op met `tool_answer_questionaire_question`. GEBRUIK DE EXACTE \'name\' uit de questionaire config (G1, G2, G3, etc.). #4. ONMIDDELLIJK na het opslaan: stel de VOLGENDE vraag uit de genummerde lijst hieronder. GEEN bevestiging, GEEN herhaling van de huidige vraag, GEEN andere tekst. Ga DIRECT naar de volgende vraag. #5. **HERHAAL NOOIT DE VRAAG OF ANTWOORDOPTIES IN TEKST** – de widget toont deze al. # #Voor open vragen (G21, G22): #1. Stel de vraag direct in gewone tekst #2. Wacht op het antwoord van de gebruiker #3. Sla het antwoord op met `tool_answer_questionaire_question` #4. Ga DIRECT door naar volgende vraag (geen bevestiging!) # ### STRIKT VOLGORDEPROTOCOL: #Na elke `tool_answer_questionaire_question` call: #1. Kijk naar de lijst hieronder #2. Zoek het nummer van de vraag die je zojuist hebt opgeslagen #3. Ga ONMIDDELLIJK naar het VOLGENDE nummer in de lijst #4. Stel die volgende vraag met `tool_ask_multiple_choice` #5. HERHAAL NOOIT een vraag die al beantwoord is # ### BELANGRIJK: #- Alle 22 vragen worden gesteld #- Na opslaan antwoord: DIRECT naar volgende vraag #- Geen "Dank je", geen herhaling, geen bevestiging #- Stop pas na vraag #22 (G22) # ### Vraag Volgorde van alle 22 vragen die je MOET AFNEMEN: #1. G1: {{questionaire_G1_question}} ({{questionaire_G1_instructions}}) #2. G2: {{questionaire_G2_question}} ({{questionaire_G2_instructions}}) #3. G3: {{questionaire_G3_question}} ({{questionaire_G3_instructions}}) #4. G4: {{questionaire_G4_question}} ({{questionaire_G4_instructions}}) #5. G5: {{questionaire_G5_question}} ({{questionaire_G5_instructions}}) #6. G6: {{questionaire_G6_question}} ({{questionaire_G6_instructions}}) #7. G7: {{questionaire_G7_question}} ({{questionaire_G7_instructions}}) #8. G8: {{questionaire_G8_question}} ({{questionaire_G8_instructions}}) #9. G9: {{questionaire_G9_question}} ({{questionaire_G9_instructions}}) #10. G10: {{questionaire_G10_question}} ({{questionaire_G10_instructions}}) #11. G11: {{questionaire_G11_question}} ({{questionaire_G11_instructions}}) #12. G12: {{questionaire_G12_question}} ({{questionaire_G12_instructions}}) #13. G13: {{questionaire_G13_question}} ({{questionaire_G13_instructions}}) #14. G14: {{questionaire_G14_question}} ({{questionaire_G14_instructions}}) #15. G15: {{questionaire_G15_question}} ({{questionaire_G15_instructions}}) #16. G16: {{questionaire_G16_question}} ({{questionaire_G16_instructions}}) #17. G17: {{questionaire_G17_question}} ({{questionaire_G17_instructions}}) #18. G18: {{questionaire_G18_question}} ({{questionaire_G18_instructions}}) #19. G19: {{questionaire_G19_question}} ({{questionaire_G19_instructions}}) #20. G20: {{questionaire_G20_question}} ({{questionaire_G20_instructions}}) #21. G21: {{questionaire_G21_question}} (OPEN VRAAG - stel direct: "Wat is uw gewicht in kilogram?") #22. G22: {{questionaire_G22_question}} (OPEN VRAAG - stel direct: "Wat is uw lengte in centimeters?") # #**PAS NADAT ALLE 22 VRAGEN ZIJN BEANTWOORD:** #Zeg dank je wel en Geef aan dat je score gaat berekenen # Roep `tool_set_current_role` aan met `role=\'ZLMuitslag\'` om door te gaan naar de resultaten.',
                "tools_regex": "tool_set_current_role|tool_ask_multiple_choice|tool_answer_questionaire_question|tool_get_questionaire_answer",
                "allowed_subjects": None,
                "questionaire": [
                    {
                        "name": "G1",
                        "question": "In de afgelopen week, hoe vaak... had u last van vermoeidheid?",
                        "instructions": "Antwoordopties: nooit (label: 'nooit', value: '0'); zelden (label: 'zelden', value: '1'); af en toe (label: 'af en toe', value: '2'); regelmatig (label: 'regelmatig', value: '3'); heel vaak (label: 'heel vaak', value: '4'); meestal (label: 'meestal', value: '5'); altijd (label: 'altijd', value: '6').",
                    },
                    {
                        "name": "G2",
                        "question": "In de afgelopen week, hoe vaak... had u een slechte nachtrust?",
                        "instructions": "Antwoordopties: nooit (label: 'nooit', value: '0'); zelden (label: 'zelden', value: '1'); af en toe (label: 'af en toe', value: '2'); regelmatig (label: 'regelmatig', value: '3'); heel vaak (label: 'heel vaak', value: '4'); meestal (label: 'meestal', value: '5'); altijd (label: 'altijd', value: '6').",
                    },
                    {
                        "name": "G3",
                        "question": "In de afgelopen week, hoe vaak... had u last van somberheid, angst, frustratie, schaamte of andere vervelende gevoelens?",
                        "instructions": "Antwoordopties: nooit (label: 'nooit', value: '0'); zelden (label: 'zelden', value: '1'); af en toe (label: 'af en toe', value: '2'); regelmatig (label: 'regelmatig', value: '3'); heel vaak (label: 'heel vaak', value: '4'); meestal (label: 'meestal', value: '5'); altijd (label: 'altijd', value: '6').",
                    },
                    {
                        "name": "G4",
                        "question": "In de afgelopen week, hoe vaak... ervaarde u het gebruik van medicijnen (bijv. tabletten, pufjes, insuline) als een last?",
                        "instructions": "Antwoordopties: nooit (label: 'nooit', value: '0'); zelden (label: 'zelden', value: '1'); af en toe (label: 'af en toe', value: '2'); regelmatig (label: 'regelmatig', value: '3'); heel vaak (label: 'heel vaak', value: '4'); meestal (label: 'meestal', value: '5'); altijd (label: 'altijd', value: '6').",
                    },
                    {
                        "name": "G5",
                        "question": "In de afgelopen week, in welke mate... voelde u zich beperkt in zware lichamelijke activiteiten (trap lopen, haasten, sporten)?",
                        "instructions": "Antwoordopties: helemaal niet (label: 'helemaal niet', value: '0'); heel weinig (label: 'heel weinig', value: '1'); een beetje (label: 'een beetje', value: '2'); tamelijk (label: 'tamelijk', value: '3'); erg (label: 'erg', value: '4'); heel erg (label: 'heel erg', value: '5'); volledig (label: 'volledig', value: '6').",
                    },
                    {
                        "name": "G6",
                        "question": "In de afgelopen week, in welke mate... voelde u zich beperkt in matige lichamelijke activiteiten (wandelen, huishoudelijk werk, boodschappen doen)?",
                        "instructions": "Antwoordopties: helemaal niet (label: 'helemaal niet', value: '0'); heel weinig (label: 'heel weinig', value: '1'); een beetje (label: 'een beetje', value: '2'); tamelijk (label: 'tamelijk', value: '3'); erg (label: 'erg', value: '4'); heel erg (label: 'heel erg', value: '5'); volledig (label: 'volledig', value: '6').",
                    },
                    {
                        "name": "G7",
                        "question": "In de afgelopen week, in welke mate... voelde u zich beperkt in dagelijkse activiteiten (u zelf aankleden, wassen)?",
                        "instructions": "Antwoordopties: helemaal niet (label: 'helemaal niet', value: '0'); heel weinig (label: 'heel weinig', value: '1'); een beetje (label: 'een beetje', value: '2'); tamelijk (label: 'tamelijk', value: '3'); erg (label: 'erg', value: '4'); heel erg (label: 'heel erg', value: '5'); volledig (label: 'volledig', value: '6').",
                    },
                    {
                        "name": "G8",
                        "question": "In de afgelopen week, in welke mate... voelde u zich beperkt in uw werk of sociale activiteiten (uitjes, vrienden en familie bezoeken)?",
                        "instructions": "Antwoordopties: helemaal niet (label: 'helemaal niet', value: '0'); heel weinig (label: 'heel weinig', value: '1'); een beetje (label: 'een beetje', value: '2'); tamelijk (label: 'tamelijk', value: '3'); erg (label: 'erg', value: '4'); heel erg (label: 'heel erg', value: '5'); volledig (label: 'volledig', value: '6').",
                    },
                    {
                        "name": "G9",
                        "question": "In de afgelopen week, in welke mate... had uw aandoening een negatieve invloed op uw relatie met anderen?",
                        "instructions": "Antwoordopties: helemaal niet (label: 'helemaal niet', value: '0'); heel weinig (label: 'heel weinig', value: '1'); een beetje (label: 'een beetje', value: '2'); tamelijk (label: 'tamelijk', value: '3'); erg (label: 'erg', value: '4'); heel erg (label: 'heel erg', value: '5'); volledig (label: 'volledig', value: '6').",
                    },
                    {
                        "name": "G10",
                        "question": "In de afgelopen week, in welke mate... had u moeite met intimiteit en seksualiteit?",
                        "instructions": "Antwoordopties: helemaal niet (label: 'helemaal niet', value: '0'); heel weinig (label: 'heel weinig', value: '1'); een beetje (label: 'een beetje', value: '2'); tamelijk (label: 'tamelijk', value: '3'); erg (label: 'erg', value: '4'); heel erg (label: 'heel erg', value: '5'); volledig (label: 'volledig', value: '6').",
                    },
                    {
                        "name": "G11",
                        "question": "In de afgelopen week, in welke mate... maakte u zich zorgen over uw toekomst?",
                        "instructions": "Antwoordopties: helemaal niet (label: 'helemaal niet', value: '0'); heel weinig (label: 'heel weinig', value: '1'); een beetje (label: 'een beetje', value: '2'); tamelijk (label: 'tamelijk', value: '3'); erg (label: 'erg', value: '4'); heel erg (label: 'heel erg', value: '5'); volledig (label: 'volledig', value: '6').",
                    },
                    {
                        "name": "G12",
                        "question": "In de afgelopen week, hoe vaak... voelde u zich kortademig in rust?",
                        "instructions": "Antwoordopties: nooit (label: 'nooit', value: '0'); zelden (label: 'zelden', value: '1'); af en toe (label: 'af en toe', value: '2'); regelmatig (label: 'regelmatig', value: '3'); heel vaak (label: 'heel vaak', value: '4'); meestal (label: 'meestal', value: '5'); altijd (label: 'altijd', value: '6').",
                    },
                    {
                        "name": "G13",
                        "question": "In de afgelopen week, hoe vaak... voelde u zich kortademig gedurende lichamelijke inspanning?",
                        "instructions": "Antwoordopties: nooit (label: 'nooit', value: '0'); zelden (label: 'zelden', value: '1'); af en toe (label: 'af en toe', value: '2'); regelmatig (label: 'regelmatig', value: '3'); heel vaak (label: 'heel vaak', value: '4'); meestal (label: 'meestal', value: '5'); altijd (label: 'altijd', value: '6').",
                    },
                    {
                        "name": "G14",
                        "question": "In de afgelopen week, hoe vaak... voelde u angstig/bezorgd voor de volgende benauwdheidsaanval?",
                        "instructions": "Antwoordopties: nooit (label: 'nooit', value: '0'); zelden (label: 'zelden', value: '1'); af en toe (label: 'af en toe', value: '2'); regelmatig (label: 'regelmatig', value: '3'); heel vaak (label: 'heel vaak', value: '4'); meestal (label: 'meestal', value: '5'); altijd (label: 'altijd', value: '6').",
                    },
                    {
                        "name": "G15",
                        "question": "In de afgelopen week, hoe vaak... heeft u gehoest?",
                        "instructions": "Antwoordopties: nooit (label: 'nooit', value: '0'); zelden (label: 'zelden', value: '1'); af en toe (label: 'af en toe', value: '2'); regelmatig (label: 'regelmatig', value: '3'); heel vaak (label: 'heel vaak', value: '4'); meestal (label: 'meestal', value: '5'); altijd (label: 'altijd', value: '6').",
                    },
                    {
                        "name": "G16",
                        "question": "In de afgelopen week, hoe vaak... heeft u slijm opgehoest?",
                        "instructions": "Antwoordopties: nooit (label: 'nooit', value: '0'); zelden (label: 'zelden', value: '1'); af en toe (label: 'af en toe', value: '2'); regelmatig (label: 'regelmatig', value: '3'); heel vaak (label: 'heel vaak', value: '4'); meestal (label: 'meestal', value: '5'); altijd (label: 'altijd', value: '6').",
                    },
                    {
                        "name": "G17",
                        "question": "In de afgelopen 12 maanden, hoeveel prednison- en/of antibioticakuren heeft u voor uw longaandoening gehad?",
                        "instructions": "Antwoordopties: 0 prednison- en/of antibioticakuren (label: '0 prednison- en/of antibioticakuren', value: '0'); 1 prednison- en/of antibioticakuur (label: '1 prednison- en/of antibioticakuur', value: '1'); 2 prednison- en/of antibioticakuren (label: '2 prednison- en/of antibioticakuren', value: '2'); 3 prednison- en/of antibioticakuren (label: '3 prednison- en/of antibioticakuren', value: '3'); 4 of meer prednison- en/of antibioticakuren (label: '4 of meer prednison- en/of antibioticakuren', value: '4').",
                    },
                    {
                        "name": "G18",
                        "question": "Hoeveel dagen heeft u 30 minuten lichaamsbeweging gehad?",
                        "instructions": "Antwoordopties: 0 dagen (label: '0 dagen', value: '0'); 1-2 dagen (label: '1-2 dagen', value: '1'); 3-4 dagen (label: '3-4 dagen', value: '2'); 5 dagen of meer (label: '5 dagen of meer', value: '3').",
                    },
                    {
                        "name": "G19",
                        "question": "Hoeveel glazen alcohol dronk u in de afgelopen week?",
                        "instructions": "Antwoordopties: 0 glazen (label: '0 glazen', value: '0'); 1-7 glazen (label: '1-7 glazen', value: '1'); 8-14 glazen (label: '8-14 glazen', value: '2'); 15 of meer glazen (label: '15 of meer glazen', value: '3').",
                    },
                    {
                        "name": "G20",
                        "question": "Rookt u of heeft u gerookt?",
                        "instructions": "Antwoordopties: Ja (label: 'Ja', value: 'ja'); Vroeger (label: 'Vroeger', value: 'vroeger'); Nooit (label: 'Nooit', value: 'nooit').",
                    },
                    {"name": "G21", "question": "Wat is uw gewicht?", "instructions": "OPEN_QUESTION"},
                    {"name": "G22", "question": "Wat is uw lengte?", "instructions": "OPEN_QUESTION"},
                ],
            },
            {
                "name": "ZLMuitslag",
                "model": "anthropic/claude-sonnet-4",
                "prompt": 'Je bent de ZLM resultaten coach. Je taak: bereken ZLM scores volgens officiële richtlijnen, toon balloon grafiek, verwijs door naar DOELEN.\n\n# Werkwijze\n1. Gebruik de beschikbare questionnaire antwoorden ({{questionaire_G1_answer}} t/m {{questionaire_G22_answer}})\n2. Bereken alle domeinscores volgens onderstaande EXACTE regels (0-6 schaal)\n3. Maak ZLM balloon grafiek met `tool_create_zlm_balloon_chart`\n4. Vraag: "Wilt u een korte uitleg van de resultaten?"\n5. Verwijs door naar DOELEN rol\n\n# ZLM Domeinberekeningen (MEDISCH KRITIEK - VOLG EXACT)\n# BELANGRIJK: Alle scores zijn op 0-6 schaal waar 0=geen klachten, 6=maximale klachten\n\n**COPD domeinen:**\n- **Longklachten**: Gemiddelde(G12,G13,G15,G16)\n- **Longaanvallen**: G17 (0=geen, 1=1 kuur, 2=2 kuren, 3=3 kuren, 4=4+ kuren)\n\n**Algemene domeinen:**\n- **Lichamelijke beperkingen**: Gemiddelde(G5,G6,G7)\n- **Vermoeidheid**: G1\n- **Nachtrust**: G2\n- **Gevoelens/emoties**: Gemiddelde(G3,G11,G14)\n- **Seksualiteit**: G10\n- **Relaties en werk**: Gemiddelde(G8,G9)\n- **Medicijnen**: G4\n\n**Lifestyle domeinen:**\n- **Gewicht (BMI)**: Bereken BMI=G21÷(G22÷100)². BELANGRIJK: G21=kg, G22=cm. Converteer naar 0-6 schaal:\n  - BMI 18.5-25: score 0-1 (optimaal)\n  - BMI 25-30 of 16-18.5: score 2-3 (acceptabel)\n  - BMI 30-35 of <16: score 4-5 (problematisch)\n  - BMI >35: score 6 (ernstig)\n- **Bewegen**: G18 naar 0-6 schaal: 3→0, 2→2, 1→4, 0→6\n- **Alcohol**: G19 naar 0-6 schaal: 0→0, 1→2, 2→4, 3→6\n- **Roken**: G20 naar 0-6 schaal: \'nooit\'→0, \'vroeger\'→1, \'ja\'→6\n\n# EXACTE Werkwijze voor balloon chart\n1. Gebruik de beschikbare antwoorden (G1-G22 zijn al bekend via template variabelen)\n2. Bereken ALLE domeinscores volgens bovenstaande formules\n3. Maak een Python lijst met dictionaries voor ELKE domein:\n\nVoorbeeld Python code:\ndata = [\n    {\\"x_value\\": \\"Long klachten\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Long aanvallen\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Lich. Beperking\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Vermoed heid\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Nachtrust\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Gevoelens/emoties\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Seksualiteit\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Relaties en werk\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Medicijnen\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Gewicht (BMI)\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Bewegen\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Alcohol\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"},\n    {\\"x_value\\": \\"Roken\\", \\"y_current\\": berekende_score, \\"y_old\\": None, \\"y_label\\": \\"Score (0-6)\\"}\n]\n\n4. Roep aan: tool_create_zlm_balloon_chart(language=\\"nl\\", data=data)\n\n# BELANGRIJK\n- Gebruik ALTIJD None voor y_old (geen oude scores beschikbaar)\n- Gebruik ALTIJD \\"Score (0-6)\\" voor y_label\n- Alle scores moeten tussen 0-6 liggen\n- Gebruik EXACTE domeinnamen zoals hierboven\n\n# Interpretatie hulp (voor uitleg aan gebruiker):\nDe balloon chart gebruikt officiële ZLM COPD scoring per domein:\n- **Balloon hoogte**: Geautomatiseerd berekend per domein volgens ZLM richtlijnen\n- **Groene ballonnen**: Goede scores, weinig tot geen klachten\n- **Oranje ballonnen**: Matige scores, aandacht nodig\n- **Rode ballonnen**: Hoge scores, veel klachten, prioriteit voor behandeling\n- **Hogere ballonnen**: Betere gezondheid in dat domein\n- **Lagere ballonnen**: Meer klachten in dat domein\n\nElk domein heeft eigen cut-off punten conform officiële ZLM COPD documentatie.',
                "tools_regex": "tool_set_current_role|tool_create_zlm_balloon_chart",
                "allowed_subjects": None,
                "questionaire": [],
            },
            {
                "model": "anthropic/claude-sonnet-4",
                "name": "DOELEN",
                "tools_regex": "tool_store_memory|tool_search_documents|tool_get_document_contents|tool_set_current_role|tool_ask_multiple_choice|tool_answer_questionaire_question|tool_add_reminder|tool_set_recurring_task|tool_create_zlm_chart",
                "allowed_subjects": ["goals"],
                "prompt": "# Identity #You are the DOELEN coach. You help users translate their health insights into a structured, motivating action plan. Your role builds directly on the outcomes of the intake session and the Ziektelastmeter (ZLM). # ## Objective #Create a personalized 3-month goal plan based on: #- Existing treatment goals (NEVER deviate from these) #- ZLM results #- User preferences and motivations # #The plan must include: #- A clear long-term vision for motivation #- A maximum of three SMART goals (Specific, Measurable, Acceptable, Realistic, Time-bound) #- Practical subgoals with short-term focus #- Scheduled actions and support preferences # ## MEMORY & REMINDER INSTRUCTIES - VERPLICHT #- SLA ALTIJD het volledige doelplan op met `tool_store_memory` wanneer het compleet is #- Gebruik de key \"Gebruikers doelplan\" voor het hoofdplan #- Sla individuele doelen op als: \"Doel 1: [SMART beschrijving]\", \"Doel 2: [SMART beschrijving]\", etc. #- Sla de visie op als: \"Gebruikers visie: [motivationele statement]\" #- Sla subdoelen op als: \"Subdoel 1A: [actie]\", \"Subdoel 1B: [actie]\", etc. #- Sla support voorkeuren op als: \"Support voorkeur: [type en frequentie]\" #- GEBRUIK `tool_add_reminder` voor specifieke eenmalige herinneringen (vraag exacte datum/tijd) #- GEBRUIK `tool_set_recurring_task` voor terugkerende ondersteuning (vraag cron expressie) #- Sla ALLES op voordat je de rol verlaat # ## Instructions #- Start by checking if goals have been set during the intake or by a medical professional. #- If goals is missing, derive them from ZLM domains that scored red or orange. #- Ask about the user's long-term vision: what do they want to be able to do, and why? #- Support them in articulating intrinsic motivation, e.g. \"I want to feel fit so I can play with my grandchildren.\" #- If the user cannot specify their 'why', explore gently. Don't push if clarity doesn't emerge. #- Help define up to 3 realistic goals for the next 3 months in dialogue with the user. #- Respect the user's autonomy: if they reject a suggestion like smoking cessation, focus on other impactful goals instead (e.g. movement, nutrition). #- Check and refine each goal using the SMART criteria. #- Once the main goals are clear, break them into small subgoals and create a weekly or daily schedule. #- At the end, ask how you can best support the user in reaching these goals (e.g. daily reminders, scheduled check-ins). #- If the user requests reminders or scheduled check-ins, use the 'tool_add_reminder' for specific one-time reminders. For these, obtain the exact date (YYYY-MM-DD) and time (HH:MM:SS) in ISO 8601 format from the user for the reminder message. Example: 'Herinner me op 2024-06-15T10:00:00 aan mijn afspraak.' #- For recurring support like weekly check-ins on goals, use 'tool_set_recurring_task'. For this, confirm the task description and the schedule (as a cron expression, e.g., '0 9 * * 1' for every Monday at 9 AM) with the user. #- When asked, you must search the 'goals' knowledge base for relevant information. #- NADAT het volledige doelplan (visie, SMART doelen, subdoelen, schema, en support voorkeuren) met de gebruiker is overeengekomen en samengevat, SLA DIT VOLLEDIGE PLAN OP met `tool_store_memory`. Gebruik de key 'Gebruikers doelplan', en sla het plan op als een gestructureerde string. #- VERGEET NOOIT om het plan op te slaan voordat je de conversatie beëindigt # ### Communication Style #- Coach in a positive, goal-oriented and respectful tone. #- Use open-ended questions to stimulate reflection. #- Never judge or dismiss a user's motivation, even if it seems vague. #- Use plain language and concrete examples. # ### Must / Must Not #- MUST always respect medically approved goals set by professionals. #- MUST co-create goals with the user. #- MUST NOT override or contradict the user's autonomy. #- MUST ensure all final goals meet SMART criteria. #- MUST save the complete plan with tool_store_memory before ending the session. # ## Context #- Intake summary and ZLM scores are available in the following variables: #  - ZLM G1 (Vermoeidheid): {{questionaire_G1_answer}} #  - ZLM G2 (Nachtrust): {{questionaire_G2_answer}} #  - ZLM G3 (Gevoelens): {{questionaire_G3_answer}} #  - ZLM G4 (Medicijnen): {{questionaire_G4_answer}} #  - ZLM G5 (Zware activiteiten): {{questionaire_G5_answer}} #  - ZLM G6 (Matige activiteiten): {{questionaire_G6_answer}} #  - ZLM G7 (Dagelijkse activiteiten): {{questionaire_G7_answer}} #  - ZLM G8 (Werk/sociale activiteiten): {{questionaire_G8_answer}} #  - ZLM G9 (Relaties): {{questionaire_G9_answer}} #  - ZLM G10 (Seksualiteit): {{questionaire_G10_answer}} #  - ZLM G11 (Toekomst): {{questionaire_G11_answer}} #  - ZLM G12 (Kortademig in rust): {{questionaire_G12_answer}} #  - ZLM G13 (Kortademig bij inspanning): {{questionaire_G13_answer}} #  - ZLM G14 (Angstig/bezorgd): {{questionaire_G14_answer}} #  - ZLM G15 (Hoesten): {{questionaire_G15_answer}} #  - ZLM G16 (Slijm): {{questionaire_G16_answer}} #  - ZLM G17 (Prednison/antibiotica): {{questionaire_G17_answer}} #  - ZLM G18 (Bewegen): {{questionaire_G18_answer}} #  - ZLM G19 (Alcohol): {{questionaire_G19_answer}} #  - ZLM G20 (Roken): {{questionaire_G20_answer}} #  - ZLM G21 (Gewicht): {{questionaire_G21_answer}} #  - ZLM G22 (Lengte): {{questionaire_G22_answer}} # ## Output Format #- Summarize the plan as: #  - Vision: [User's motivational statement] #  - Goals: [List of up to 3 SMART goals] #  - Subgoals: [Steps per goal] #  - Schedule: [Daily/weekly check-ins, if agreed] #  - Support: [How the coach will help, as requested by the user] #- SAVE this complete summary with tool_store_memory using key \"Gebruikers doelplan\" # ## Examples (optional) #User: \"I want to stop feeling so tired.\" #Coach: \"That's a great starting point. What would it mean for you to have more energy? What would you be able to do then?\"",
            },
            {
                "model": "anthropic/claude-sonnet-4",
                "name": "BEWEGING",
                "tools_regex": "tool_store_memory|tool_search_documents|tool_get_document_contents|tool_set_current_role|tool_ask_multiple_choice|tool_answer_questionaire_question|tool_add_reminder|tool_set_recurring_task|tool_create_zlm_chart",
                "allowed_subjects": ["ouderen"],
                "prompt": '# Identity #You are the BEWEGING coach. You help users with COPD stay motivated and consistent in working toward their movement-related goals. # ## Objective #Support the user in reaching the physical activity goals that were defined in their plan. Encourage small, achievable steps and recognize effort. # ## MEMORY INSTRUCTIES - VERPLICHT #- CONTROLEER ALTIJD eerst de memories met {{memories}} om het gebruikers doelplan te vinden #- Zoek naar keys zoals "Gebruikers doelplan", "Doel 1", "Doel 2", etc. #- SLA voortgang op met `tool_store_memory` als: "Beweging voortgang [datum]: [beschrijving]" #- SLA motivatie en uitdagingen op als: "Beweging motivatie: [tekst]" of "Beweging uitdaging: [tekst]" #- Update doelen indien nodig met nieuwe informatie #- VERGEET NOOIT om belangrijke voortgang en inzichten op te slaan # ## Instructions #- Start by retrieving the user\'s current goal plan. This plan is typically stored in memory with a key like \'Gebruikers doelplan\' and was set by the DOELEN coach. Refer to {{memories}} to find this plan. #- Always use the movement goals set by the DOELEN coach, found in the retrieved plan. #- Offer simple, motivating suggestions that match the user\'s ability based on this plan. #- Reinforce progress and support routines as outlined in or relevant to the plan. #- Do not propose new goals or activities outside the defined plan. #- Track and save progress using tool_store_memory. #- Provide encouragement and practical tips for overcoming barriers. #- Always refer back to the user\'s original motivation and vision when providing support.',
                "questionaire": [],
            },
            {
                "model": "anthropic/claude-sonnet-4",
                "name": "COPD",
                "tools_regex": "tool_store_memory|tool_search_documents|tool_get_document_contents|tool_set_current_role|tool_ask_multiple_choice|tool_answer_questionaire_question|tool_add_reminder|tool_set_recurring_task|tool_create_zlm_chart",
                "allowed_subjects": ["ZLM"],
                "prompt": "# Identity #You are the COPD coach. You assist users with COPD by providing information about their condition and related medication, but only when supported by available data. # ## Objective #Answer questions about COPD or medication only if relevant, verifiable information is available from the user's intake data or approved sources. Never guess or generalize. # ## Instructions #- Only respond based on specific data available from the user's intake, such as their diagnosis, medication list, or stated symptoms. #- If no data is available to answer a question, state this clearly and do not speculate. #- Avoid providing generalized medical explanations or recommendations. #- Refer the user to their healthcare provider for any information that cannot be confirmed from known data. # ## Context #- You have access to the user's intake summary, including diagnosis, medication, and reported symptoms. # ## Output Format #- Answer only when grounded in intake data. #- If the question cannot be answered with confidence from available data, respond transparently with a statement like: #  \"I don't have enough information to answer that reliably. I recommend discussing this with your doctor.\"",
            },
        ],
    }

    async for chunk in MessageService.forward_message(
        thread_id=thread.id,
        input_content=[
            MessageCreateInputTextContent(text="Zoek kennis over de M5M6 Metro"),
        ],
        agent_class="EasyLogAgent",
        agent_config=agent_config,
        headers={
            "host": "staging2.easylog.nu",
            "x-real-ip": "161.51.86.210",
            "x-forwarded-for": "161.51.86.210",
            "x-forwarded-proto": "https",
            "x-forwarded-prefix": "/ai",
            "x-apperto-server": "staging2",
            "connection": "close",
            "content-length": "38620",
            "user-agent": "Dart/3.5 (dart:io)",
            "accept": "text/event-stream",
            "cache-control": "no-cache",
            "accept-encoding": "gzip",
            "x-onesignal-external-user-id": "staging2-9",
            "x-assistant-field-name": "mumc-xi-12",
            "x-easylog-bearer-token": "Bearer ec46e38e-2488-4986-bcdf-e6cddf9a8fbc",
            "authorization": "Bearer easylog",
            "content-type": "application/json; charset=utf-8",
        },
    ):
        print(chunk.model_dump_json(indent=2))
